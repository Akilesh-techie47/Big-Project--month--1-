import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../services/api';
import { useToast } from '../hooks/useToast.jsx';
import StatCard from '../components/StatCard';
import SentimentDistributionChart from '../charts/SentimentDistributionChart';
import SentimentTrendChart from '../charts/SentimentTrendChart';
import RatingDistributionChart from '../charts/RatingDistributionChart';
import ProductCard from '../components/ProductCard';
import './Dashboard.css';

export default function Dashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsApi.getGlobal();
      setStats(response.data.data);
      setRecentProducts(response.data.data.recent_products || []);
    } catch (error) {
      addToast(error.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card card skeleton" style={{ height: '120px' }} />
          ))}
        </div>
        <div className="charts-grid">
          <div className="chart-card card skeleton" style={{ height: '350px' }} />
          <div className="chart-card card skeleton" style={{ height: '350px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of sentiment analysis across all products</p>
      </header>

      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={stats.total_products}
          icon="📦"
        />
        <StatCard
          title="Total Reviews"
          value={stats.total_reviews.toLocaleString()}
          icon="💬"
        />
        <StatCard
          title="Positive Sentiment"
          value={`${stats.sentiment_percentages.positive}%`}
          icon="👍"
        />
        <StatCard
          title="Negative Sentiment"
          value={`${stats.sentiment_percentages.negative}%`}
          icon="👎"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card card">
          <div className="card-header">
            <h3>Sentiment Distribution</h3>
          </div>
          <div className="card-body">
            <SentimentDistributionChart data={stats.sentiment_distribution} />
          </div>
        </div>

        <div className="chart-card card">
          <div className="card-header">
            <h3>Rating Distribution</h3>
          </div>
          <div className="card-body">
            <RatingDistributionChart data={stats.rating_distribution} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3>Sentiment Trends (Last 30 Days)</h3>
          </div>
          <div className="card-body">
            <SentimentTrendChart data={stats.trends} />
          </div>
        </div>
      </div>

      <section className="recent-products">
        <div className="section-header">
          <h2>Recent Analyses</h2>
          <Link to="/history" className="view-all">View All</Link>
        </div>
        {recentProducts.length === 0 ? (
          <div className="empty-state card">
            <p>No products analyzed yet.</p>
            <Link to="/search" className="btn btn-primary">Analyze Your First Product</Link>
          </div>
        ) : (
          <div className="products-grid">
            {recentProducts.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}