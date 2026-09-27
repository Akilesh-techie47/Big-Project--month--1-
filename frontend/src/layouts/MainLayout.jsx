import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/search', label: 'Search Products', icon: '🔍' },
    { path: '/history', label: 'Analysis History', icon: '📜' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="logo">
          <Link to="/">📊 Sentiment Analyzer</Link>
        </h1>
      </header>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}