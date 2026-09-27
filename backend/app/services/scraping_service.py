from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.scrapers.factory import get_scraper, SUPPORTED_SOURCES
from app.scrapers.base_scraper import ScrapedReview, ScrapedProduct
from app.database.repositories import ProductRepository, ReviewRepository, AnalysisRepository
from app.models.product import Product
from app.models.review import Review
from app.models.analysis import Analysis
from app.sentiment.service import clean_text, analyze_sentiment
from app.utils.keywords import extract_keywords
import logging

logger = logging.getLogger(__name__)


class ScrapingService:
    def __init__(self):
        self.product_repo = ProductRepository()
        self.review_repo = ReviewRepository()
        self.analysis_repo = AnalysisRepository()

    def scrape_and_analyze(
        self, query: str, source: str, limit: int = 50
    ) -> dict:
        if source.lower() not in SUPPORTED_SOURCES:
            return {
                "success": False,
                "error": f"Unsupported source: {source}. Supported: {SUPPORTED_SOURCES}",
            }

        scraper = get_scraper(source)
        if not scraper:
            return {"success": False, "error": "Failed to create scraper"}

        try:
            with scraper:
                product_info = scraper.search_product(query)
                if not product_info:
                    return {"success": False, "error": "Product not found"}

                logger.info(f"Found product: {product_info.name}")

                product = self._get_or_create_product(product_info)
                logger.info(f"Product ID: {product.id}")

                scraped_reviews = scraper.scrape_reviews(product_info.url, limit)
                logger.info(f"Scraped {len(scraped_reviews)} reviews")

                if not scraped_reviews:
                    return {
                        "success": True,
                        "product_id": str(product.id),
                        "message": "No reviews found",
                        "reviews_processed": 0,
                    }

                processed = self._process_reviews(product, scraped_reviews)
                logger.info(f"Processed {processed} new reviews")

                self._update_analysis(product)

                return {
                    "success": True,
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "reviews_processed": processed,
                    "total_reviews": product.review_count,
                }

        except Exception as e:
            logger.error(f"Scraping failed: {e}")
            return {"success": False, "error": str(e)}

    def _get_or_create_product(self, product_info: ScrapedProduct) -> Product:
        existing = self.product_repo.find_by_source_and_name(
            product_info.source, product_info.name
        )
        if existing:
            return existing

        product = Product(
            name=product_info.name,
            source=product_info.source,
            url=product_info.url,
        )
        return self.product_repo.create(product)

    def _process_reviews(self, product: Product, scraped_reviews: List[ScrapedReview]) -> int:
        reviews_to_insert = []
        processed = 0

        for sr in scraped_reviews:
            cleaned = clean_text(sr.review_text)
            if not cleaned:
                continue

            sentiment_result = analyze_sentiment(cleaned)

            review = Review(
                product_id=product.id,
                source=sr.source,
                review_text=sr.review_text,
                cleaned_text=cleaned,
                rating=sr.rating if sr.rating > 0 else 0,
                review_date=self._parse_date(sr.review_date),
                reviewer=sr.reviewer,
                sentiment=sentiment_result["label"],
                sentiment_score=sentiment_result["score"],
            )
            reviews_to_insert.append(review)

        if reviews_to_insert:
            inserted = self.review_repo.bulk_create(reviews_to_insert)
            processed = len(inserted)

        if processed > 0:
            product.review_count = self.review_repo.count_by_product_id(product.id)
            self.product_repo.update(product)

        return processed

    def _parse_date(self, date_str: str) -> datetime:
        if not date_str:
            return datetime.utcnow()
        formats = [
            "%B %d, %Y",
            "%d %B %Y",
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%m/%d/%Y",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        return datetime.utcnow()

    def _update_analysis(self, product: Product):
        sentiment_counts = self.review_repo.get_sentiment_counts(product.id)
        total = sum(sentiment_counts.values())
        if total == 0:
            return

        rating_dist = self.review_repo.get_rating_distribution(product.id)
        avg_rating = 0
        if rating_dist:
            total_ratings = sum(int(k) * v for k, v in rating_dist.items())
            avg_rating = total_ratings / total

        review_texts = self.review_repo.get_reviews_for_keywords(product.id)
        top_keywords = extract_keywords(review_texts, top_n=10)

        analysis = Analysis(
            product_id=product.id,
            positive_count=sentiment_counts.get("positive", 0),
            neutral_count=sentiment_counts.get("neutral", 0),
            negative_count=sentiment_counts.get("negative", 0),
            positive_percentage=round(sentiment_counts.get("positive", 0) / total * 100, 1),
            neutral_percentage=round(sentiment_counts.get("neutral", 0) / total * 100, 1),
            negative_percentage=round(sentiment_counts.get("negative", 0) / total * 100, 1),
            average_rating=round(avg_rating, 1),
            top_keywords=top_keywords,
        )
        self.analysis_repo.upsert(analysis)

        product.rating = round(avg_rating, 1)
        self.product_repo.update(product)