import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { productsApi, statsApi } from '../services/api';
import { useToast } from '../hooks/useToast.jsx';
import SentimentDistributionChart from '../charts/SentimentDistributionChart';
import SentimentTrendChart from '../charts/SentimentTrendChart';
import RatingDistributionChart from '../charts/RatingDistributionChart';
import KeywordsChart from '../charts/KeywordsChart';
import ReviewTable from '../components/ReviewTable';
import ReviewFilters from '../components/ReviewFilters';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [trends, setTrends] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [filters, setFilters] = useState({ sentiment: '', rating: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    loadProductData();
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [id, filters, pagination.page]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const [productRes, sentimentRes, trendsRes, keywordsRes] = await Promise.all([
        productsApi.getById(id),
        productsApi.getSentiment(id),
        productsApi.getTrends(id),
        productsApi.getKeywords(id),
      ]);

      setProduct(productRes.data.data);
      setSentiment(sentimentRes.data.data);
      setTrends(trendsRes.data.data.trends || []);
      setKeywords(keywordsRes.data.data.top_keywords || []);
    } catch (error) {
      addToast(error.message || 'Failed to load product', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const params = {
        limit: pagination.limit,
        skip: (pagination.page - 1) * pagination.limit,
        sentiment: filters.sentiment || undefined,
      };
      const response = await productsApi.getReviews(id, params);
      setReviews(response.data.data.reviews);
      setPagination((prev) => ({ ...prev, total: response.data.data.total }));
    } catch (error) {
      addToast(error.message || 'Failed to load reviews', 'error');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ sentiment: '', rating: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="skeleton" style={{ height: '200px' }} />
        <div className="charts-grid">
          <div className="skeleton card" style={{ height: '350px' }} />
          <div className="skeleton card" style={{ height: '350px' }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div className="empty-state card">
          <h2>Product Not Found</h2>
          <p>The requested product could not be found.</p>
        </div>
      </div>
    );
  }

  const overallSentiment = () => {
    const pos = sentiment?.positive_percentage || 0;
    const neg = sentiment?.negative_percentage || 0;
    if (pos > neg) return 'positive';
    if (neg > pos) return 'negative';
    return 'neutral';
  };

  const sentimentLabel = overallSentiment();
  const sentimentColor = {
    positive: 'var(--success)',
    neutral: 'var(--warning)',
    negative: 'var(--danger)',
  }[sentimentLabel];

  return (
    <div className="product-detail">
      <header className="product-header">
        <div>
          <h1>{product.name}</h1>
          <div className="product-meta">
            <span className="source-badge">{product.source}</span>
            <span>•</span>
            <span>{product.review_count} reviews</span>
            <span>•</span>
            <span>Analyzed {product.created_at ? format(new Date(product.created_at), 'MMM d, yyyy') : 'recently'}</span>
          </div>
        </div>
        <div className="product-actions">
          <span
            className="overall-sentiment"
            style={{ background: sentimentColor, color: 'white' }}
          >
            {sentimentLabel.charAt(0).toUpperCase() + sentimentLabel.slice(1)}
          </span>
        </div>
      </header>

      <div className="product-stats">
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {(sentiment?.positive_percentage || 0).toFixed(1)}%
          </div>
          <div className="stat-label">Positive</div>
          <div className="stat-detail">{sentiment?.positive_count || 0} reviews</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {(sentiment?.neutral_percentage || 0).toFixed(1)}%
          </div>
          <div className="stat-label">Neutral</div>
          <div className="stat-detail">{sentiment?.neutral_count || 0} reviews</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {(sentiment?.negative_percentage || 0).toFixed(1)}%
          </div>
          <div className="stat-label">Negative</div>
          <div className="stat-detail">{sentiment?.negative_count || 0} reviews</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {(sentiment?.average_rating || 0).toFixed(1)}
          </div>
          <div className="stat-label">Avg Rating</div>
          <div className="stat-detail">Out of 5.0</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card card">
          <div className="card-header"><h3>Sentiment Distribution</h3></div>
          <div className="card-body">
            <SentimentDistributionChart data={sentiment} />
          </div>
        </div>
        <div className="chart-card card">
          <div className="card-header"><h3>Rating Distribution</h3></div>
          <div className="card-body">
            <RatingDistributionChart data={sentiment?.rating_distribution} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card card">
          <div className="card-header"><h3>Sentiment Trends</h3></div>
          <div className="card-body">
            <SentimentTrendChart data={trends} />
          </div>
        </div>
        <div className="chart-card card">
          <div className="card-header"><h3>Top Keywords</h3></div>
          <div className="card-body">
            <KeywordsChart keywords={keywords} />
          </div>
        </div>
      </div>

      <section className="reviews-section">
        <div className="section-header">
          <h2>Reviews ({pagination.total})</h2>
        </div>

        <ReviewFilters
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <ReviewTable reviews={reviews} loading={reviewsLoading} />

        {pagination.total > pagination.limit && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}