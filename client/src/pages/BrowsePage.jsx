import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import { useSchoolSearch } from '../hooks/useSchoolSearch';
import './BrowsePage.css';

export default function BrowsePage() {
  const { currency } = useCurrency();
  const field = getCurrencyField(currency);

  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [schools, setSchools] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const { query, setQuery, results: searchResults, loading: searchLoading } = useSchoolSearch();
  const [mode, setMode] = useState('browse'); // 'browse' or 'search'

  useEffect(() => {
    api.getCountries()
      .then(setCountries)
      .catch(() => {})
      .finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      setSchools([]);
      return;
    }
    setLoadingSchools(true);
    api.getCountrySchools(selectedCountry)
      .then(setSchools)
      .catch(() => setSchools([]))
      .finally(() => setLoadingSchools(false));
  }, [selectedCountry]);

  return (
    <div className="browse-page">
      <h1>Browse Salaries</h1>
      <p className="page-subtitle">Explore teacher salary data by country or search for a specific school.</p>

      <div className="browse-tabs">
        <button
          className={`tab-btn ${mode === 'browse' ? 'active' : ''}`}
          onClick={() => setMode('browse')}
        >
          Browse by Country
        </button>
        <button
          className={`tab-btn ${mode === 'search' ? 'active' : ''}`}
          onClick={() => setMode('search')}
        >
          Search Schools
        </button>
      </div>

      {mode === 'browse' && (
        <div className="browse-content">
          <div className="form-group">
            <select
              className="form-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">
                {loadingCountries ? 'Loading countries...' : 'Select a country...'}
              </option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.school_count} {c.school_count === 1 ? 'school' : 'schools'})
                </option>
              ))}
            </select>
          </div>

          {loadingSchools && <div className="loading">Loading schools...</div>}

          {!loadingSchools && selectedCountry && schools.length === 0 && (
            <div className="empty-state">No schools with salary data in this country yet.</div>
          )}

          <div className="school-grid">
            {schools.map((school) => (
              <Link key={school.id} to={`/school/${school.id}`} className="school-card">
                <h3>{school.name}</h3>
                {school.averages ? (
                  <div className="card-avg">
                    <span className="avg-label">Avg. Teacher Salary</span>
                    <span className="avg-amount">
                      {formatCurrency(school.averages[field], currency)}
                    </span>
                    {school.averages.local_currency_code && school.averages.local_currency_code !== currency && (
                      <span className="avg-local">
                        {formatCurrency(school.averages.local, school.averages.local_currency_code)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="no-avg">No teacher salary data yet</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {mode === 'search' && (
        <div className="search-content">
          <div className="form-group">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by school name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {searchLoading && <div className="loading">Searching...</div>}

          <div className="school-grid">
            {searchResults.map((school) => (
              <Link key={school.id} to={`/school/${school.id}`} className="school-card">
                <h3>{school.name}</h3>
                <span className="school-country-tag">{school.countries?.name}</span>
              </Link>
            ))}
          </div>

          {query.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <div className="empty-state">No schools found matching "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}
