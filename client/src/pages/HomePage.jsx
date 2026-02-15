import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import './HomePage.css';

export default function HomePage() {
  const [stats, setStats] = useState({ schools: 0, submissions: 0 });
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <h1>International School Pay</h1>
        <div className="cta-card">
          <h2>Help fellow teachers make informed decisions</h2>
          <p>Your anonymous submission helps build the most complete salary database for international schools. Every data point matters.</p>
          <Link to="/submit" className="btn btn-cta">
            Submit My Salary
          </Link>
        </div>
        <Link to="/browse" className="browse-link">
          Or browse existing salary data →
        </Link>
      </section>

      <button
        className="how-toggle"
        onClick={() => setShowHowItWorks(!showHowItWorks)}
      >
        How does it work? {showHowItWorks ? '▲' : '▼'}
      </button>

      {showHowItWorks && (
        <section className="how-it-works">
          <div className="steps">
            <div className="step">
              <div className="step-icon">✏️</div>
              <h3>Submit your package</h3>
              <p>Anonymously share your salary, accommodation, pension and benefits. Takes under 2 minutes.</p>
            </div>
            <div className="step step-accent">
              <div className="step-icon">✅</div>
              <h3>We review it</h3>
              <p>Every submission is checked for quality before it goes live. No junk data.</p>
            </div>
            <div className="step">
              <div className="step-icon">🔍</div>
              <h3>Compare schools</h3>
              <p>Search by school or country. See average teacher salaries and full package breakdowns.</p>
            </div>
          </div>
        </section>
      )}

      <section className="stats-bar">
        <div className="stat">
          <span className="stat-number">{stats.schools.toLocaleString()}</span>
          <span className="stat-label">schools submitted</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <span className="stat-number">{stats.submissions.toLocaleString()}</span>
          <span className="stat-label">salary submissions</span>
        </div>
      </section>
    </div>
  );
}
