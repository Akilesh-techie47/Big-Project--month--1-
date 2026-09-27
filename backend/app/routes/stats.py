from flask import Blueprint, jsonify
from app.database.repositories import ProductRepository, ReviewRepository
from app.utils.responses import success_response, error_response
import logging

logger = logging.getLogger(__name__)

stats_bp = Blueprint("stats", __name__)

product_repo = ProductRepository()
review_repo = ReviewRepository()


@stats_bp.route("/stats", methods=["GET"])
def get_global_stats():
    try:
        total_products = product_repo.count()
        total_reviews = review_repo.collection.count_documents({})

        pipeline = [
            {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
        ]
        sentiment_results = review_repo.collection.aggregate(pipeline)
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        for r in sentiment_results:
            sentiment_counts[r["_id"]] = r["count"]

        total_sentiment = sum(sentiment_counts.values())
        percentages = {}
        for k, v in sentiment_counts.items():
            percentages[k] = round(v / total_sentiment * 100, 1) if total_sentiment else 0

        recent_products = product_repo.find_all(limit=5)

        return success_response({
            "total_products": total_products,
            "total_reviews": total_reviews,
            "sentiment_distribution": sentiment_counts,
            "sentiment_percentages": percentages,
            "recent_products": [p.to_dict() for p in recent_products],
        })
    except Exception as e:
        logger.error(f"Get stats failed: {e}")
        return error_response("Failed to fetch statistics")