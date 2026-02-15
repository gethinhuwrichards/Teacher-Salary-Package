import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>International School Salaries, Finally Transparent</h1>
          <p className="hero-subtitle">
            Real salary and benefits data shared by international school teachers across the globe.
            Anonymous, verified, and completely free.
          </p>
          <div className="hero-ctas">
            <Link to="/submit" className="btn btn-primary btn-lg">
              Submit My Salary
            </Link>
            <Link to="/browse" className="btn btn-secondary btn-lg">
              View Salaries
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="stat-card">
            <div className="stat-icon">🌍</div>
            <div className="stat-number">169</div>
            <div className="stat-label">Countries</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏫</div>
            <div className="stat-number">2,426</div>
            <div className="stat-label">Schools</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-number">100%</div>
            <div className="stat-label">Anonymous</div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Submit</h3>
            <p>Share your international school salary and package anonymously. It takes less than 2 minutes.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Review</h3>
            <p>Our team reviews submissions to ensure data quality before publishing.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Browse</h3>
            <p>Search by international school or country to compare salaries and benefit packages.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
