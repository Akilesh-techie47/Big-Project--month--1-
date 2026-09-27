import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scrapingApi } from '../services/api';
import { useToast } from '../hooks/useToast.jsx';
import SearchForm from '../components/SearchForm';
import './Search.css';

export default function SearchPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(null);

  const loadSources = async () => {
    try {
      const response = await scrapingApi.getSources();
      setSources(response.data.data.sources);
    } catch (error) {
      setSources(['amazon', 'flipkart']);
    } finally {
      setLoadingSources(false);
    }
  };

  const handleSearch = async (formData) => {
    setSearching(true);
    setProgress('Searching product...');

    try {
      const response = await scrapingApi.scrape(formData);
      if (response.data.success) {
        addToast('Analysis complete!', 'success');
        navigate(`/product/${response.data.data.product_id}`);
      } else {
        addToast(response.data.error || 'Search failed', 'error');
      }
    } catch (error) {
      addToast(error.message || 'Search failed', 'error');
    } finally {
      setSearching(false);
      setProgress(null);
    }
  };

  return (
    <div className="search-page">
      <header className="page-header">
        <h1>Search Products</h1>
        <p>Enter a product name to scrape reviews and analyze sentiment</p>
      </header>

      <div className="search-container">
        {loadingSources ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
              <span className="loading-spinner" />
              <p>Loading sources...</p>
            </div>
          </div>
        ) : (
          <SearchForm
            onSearch={handleSearch}
            loading={searching}
            sources={sources}
          />
        )}

        {progress && (
          <div className="progress card">
            <div className="card-body">
              <div className="progress-steps">
                <div className="step active">Searching product</div>
                <div className="step">Opening source</div>
                <div className="step">Collecting reviews</div>
                <div className="step">Cleaning reviews</div>
                <div className="step">Analyzing sentiment</div>
                <div className="step">Saving results</div>
              </div>
              <p className="progress-message">{progress}</p>
            </div>
          </div>
        )}

        <div className="features">
          <h3>Supported Sources</h3>
          <div className="feature-cards">
            <div className="feature-card card">
              <span className="feature-icon">🛒</span>
              <h4>Amazon</h4>
              <p>Scrape reviews from Amazon product pages</p>
            </div>
            <div className="feature-card card">
              <span className="feature-icon">🛍️</span>
              <h4>Flipkart</h4>
              <p>Scrape reviews from Flipkart product pages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}