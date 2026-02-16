import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import { normalizeQuery } from '../utils/normalize';
import './BrowsePage.css';

export default function BrowsePage() {
  const { currency } = useCurrency();
  const field = getCurrencyField(currency);

  const [allSchools, setAllSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getBrowseSchools()
      .then(setAllSchools)
      .catch(() => setAllSchools([]))
      .finally(() => setLoading(false));
  }, []);

  // Extract unique countries from school data
  const countries = useMemo(() => {
    const map = new Map();
    for (const school of allSchools) {
      if (!map.has(school.country_id)) {
        map.set(school.country_id, {
          id: school.country_id,
          name: school.countries?.name || 'Unknown',
          count: 0,
        });
      }
      map.get(school.country_id).count++;
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allSchools]);

  // Filter schools by country and search query
  const filteredSchools = useMemo(() => {
    let result = allSchools;

    if (selectedCountry) {
      result = result.filter(s => String(s.country_id) === String(selectedCountry));
    }

    if (searchQuery.trim().length >= 2) {
      const normalized = normalizeQuery(searchQuery);
      const terms = normalized.split(' ').filter(Boolean);
      result = result.filter(school => {
        const name = school.name.toLowerCase();
        return terms.every(term => name.includes(term));
      });
    }

    return result;
  }, [allSchools, selectedCountry, searchQuery]);

  return (
    <div className="browse-page">
      <h1>Browse Salaries</h1>
      <p className="page-subtitle">Explore teacher salary data by country or search for a specific school.</p>

      <div className="browse-filters">
        <select
          className="form-select filter-select"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.count} {c.count === 1 ? 'school' : 'schools'})
            </option>
          ))}
        </select>

        <input
          type="text"
          className="form-input search-input"
          placeholder="Search by school name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && <div className="loading">Loading schools...</div>}

      {!loading && filteredSchools.length === 0 && (
        <div className="empty-state">
          {allSchools.length === 0
            ? 'No schools with salary data yet.'
            : 'No schools match your filters.'}
        </div>
      )}

      {!loading && filteredSchools.length > 0 && (
        <p className="results-count">
          {filteredSchools.length} {filteredSchools.length === 1 ? 'school' : 'schools'}
        </p>
      )}

      <div className="school-grid">
        {filteredSchools.map((school) => (
          <Link key={school.id} to={`/school/${school.id}`} className="school-card">
            <h3>{school.name}</h3>
            <span className="school-country-tag">{school.countries?.name}</span>
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
  );
}
