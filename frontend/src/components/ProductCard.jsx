import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function ProductCard({ product }) {
  const sentimentColors = {
    positive: 'var(--success)',
    neutral: 'var(--warning)',
    negative: 'var(--danger)',
  };

  const getOverallSentiment = (p) => {
    const pos = p.positive_percentage || 0;
    const neg = p.negative_percentage || 0;
    if (pos > neg) return 'positive';
    if (neg > pos) return 'negative';
    return 'neutral';
  };

  const overall = getOverallSentiment(product);

  return (
    <Link to={`/product/${product.id || product._id}`} className="product-card card">
      <div className="product-header">
        <div>
          <h3 className="product-name">{product.name}</h3>
          <span className="product-source">{product.source}</span>
        </div>
        <span className={`badge badge-${overall}`}>{overall}</span>
      </div>

      <div className="product-stats">
        <div className="stat">
          <span className="stat-value">{product.rating?.toFixed(1) || '0.0'}</span>
          <span className="stat-label">Avg Rating</span>
        </div>
        <div className="stat">
          <span className="stat-value">{product.review_count || 0}</span>
          <span className="stat-label">Reviews</span>
        </div>
        <div className="stat">
          <span className="stat-value">{(product.positive_percentage || 0).toFixed(0)}%</span>
          <span className="stat-label">Positive</span>
        </div>
      </div>

      <div className="product-meta">
        <span>Analyzed: {product.created_at ? format(new Date(product.created_at), 'MMM d, yyyy') : 'Unknown'}</span>
      </div>
    </Link>
  );
}