import { Link } from 'react-router-dom';
import CurrencySelector from './CurrencySelector';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🌍</span>
          <span className="logo-text">IntlTeacher<span className="logo-highlight">Pay</span></span>
        </Link>
        <nav className="header-nav">
          <Link to="/submit" className="nav-link">Submit Salary</Link>
          <Link to="/browse" className="nav-link">View Salaries</Link>
          <CurrencySelector />
        </nav>
      </div>
    </header>
  );
}
