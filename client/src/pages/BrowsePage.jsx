import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { normalizeQuery } from '../utils/normalize';
import './BrowsePage.css';

export default function BrowsePage() {
  const [allSchools, setAllSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getBrowseSchools()
      .then(setAllSchools)
      .catch(() => setAllSchools([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter schools by search query
  const filteredSchools = useMemo(() => {
    let result = allSchools;

    if (searchQuery.trim().length >= 2) {
      const normalized = normalizeQuery(searchQuery);
      const terms = normalized.split(' ').filter(Boolean);
      result = result.filter(school => {
        const name = school.name.toLowerCase();
        return terms.every(term => name.includes(term));
      });
    }

    return result;
  }, [allSchools, searchQuery]);

  // Group filtered schools by country
  const groupedByCountry = useMemo(() => {
    const groups = new Map();
    for (const school of filteredSchools) {
      const countryName = school.countries?.name || 'Unknown';
      if (!groups.has(countryName)) {
        groups.set(countryName, []);
      }
      groups.get(countryName).push(school);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, schools]) => ({
        country,
        schools: schools.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredSchools]);

  return (
    <div className="browse-page">
      <h1>Browse Salaries</h1>

      <input
        type="text"
        className="form-input browse-search"
        placeholder="Search for a school..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading && <div className="loading">Loading schools...</div>}

      {!loading && filteredSchools.length === 0 && (
        <div className="empty-state">
          {allSchools.length === 0
            ? 'No schools with salary data yet.'
            : 'No schools match your search.'}
        </div>
      )}

      {!loading && groupedByCountry.map(({ country, schools }) => (
        <div key={country} className="country-group">
          <h2 className="country-heading">{country}</h2>
          <div className="school-list">
            {schools.map((school) => (
              <Link key={school.id} to={`/school/${school.id}`} className="school-bar">
                <span className="school-bar-name">{school.name}</span>
                <span className="school-bar-country">{country}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
