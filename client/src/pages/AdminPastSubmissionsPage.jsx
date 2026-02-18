import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import { getPositionLabel } from '../utils/constants';
import './AdminPastSubmissionsPage.css';

export default function AdminPastSubmissionsPage() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const field = getCurrencyField(currency);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  // School search
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolResults, setSchoolResults] = useState([]);
  const [schoolSearching, setSchoolSearching] = useState(false);
  const [filteredSchool, setFilteredSchool] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadSubmissions();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (schoolQuery.trim().length < 2) {
      setSchoolResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSchoolSearching(true);
      try {
        const results = await api.searchSchools(schoolQuery.trim());
        setSchoolResults(results);
        setShowDropdown(true);
      } catch {
        setSchoolResults([]);
      } finally {
        setSchoolSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [schoolQuery]);

  async function loadSubmissions(schoolId) {
    setLoading(true);
    setSelected(new Set());
    try {
      const data = await api.getAllApprovedSubmissions(schoolId || null);
      setSubmissions(data);
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message === 'Invalid or expired session') {
        localStorage.removeItem('adminToken');
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSchool(school) {
    setFilteredSchool(school);
    setSchoolQuery(school.name);
    setShowDropdown(false);
    loadSubmissions(school.id);
  }

  function handleClearFilter() {
    setFilteredSchool(null);
    setSchoolQuery('');
    loadSubmissions();
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === submissions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(submissions.map(s => s.id)));
    }
  }

  async function handleBulkAction(status) {
    if (selected.size === 0) return;
    const label = status === 'pending' ? 'review queue' : 'archive';
    if (!confirm(`Move ${selected.size} submission(s) to ${label}? They will be removed from viewable salaries.`)) return;

    setActionLoading(true);
    try {
      await api.bulkUpdateStatus([...selected], status);
      setSubmissions(prev => prev.filter(s => !selected.has(s.id)));
      setSelected(new Set());
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading submissions...</div>;
  }

  return (
    <div className="admin-past">
      <div className="admin-header">
        <h1>Accepted Submissions ({submissions.length})</h1>
        <div className="admin-nav">
          <Link to="/admin/review" className="btn btn-primary btn-sm">Review Queue</Link>
          <Link to="/admin/archived" className="btn btn-secondary btn-sm">Archived</Link>
          <Link to="/admin/malicious" className="btn btn-secondary btn-sm">Malicious IP</Link>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              localStorage.removeItem('adminToken');
              navigate('/admin');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="past-toolbar">
        <div className="school-filter" ref={wrapperRef}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by school..."
            value={schoolQuery}
            onChange={(e) => {
              setSchoolQuery(e.target.value);
              if (filteredSchool) {
                setFilteredSchool(null);
                loadSubmissions();
              }
            }}
            onFocus={() => schoolResults.length > 0 && setShowDropdown(true)}
          />
          {schoolSearching && <span className="filter-loader">Searching...</span>}
          {showDropdown && schoolResults.length > 0 && (
            <ul className="filter-dropdown">
              {schoolResults.map((school) => (
                <li
                  key={school.id}
                  className="filter-item"
                  onClick={() => handleSelectSchool(school)}
                >
                  <span>{school.name}</span>
                  <span className="filter-country">{school.countries?.name}</span>
                </li>
              ))}
            </ul>
          )}
          {filteredSchool && (
            <button type="button" className="clear-filter-btn" onClick={handleClearFilter}>
              Clear filter
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">{selected.size} selected</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleBulkAction('pending')}
              disabled={actionLoading}
            >
              Send to Review
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleBulkAction('denied')}
              disabled={actionLoading}
            >
              Archive
            </button>
          </div>
        )}
      </div>

      {submissions.length === 0 && (
        <div className="empty-state">
          {filteredSchool ? 'No approved submissions for this school.' : 'No approved submissions in the database.'}
        </div>
      )}

      {submissions.length > 0 && (
        <table className="past-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.size === submissions.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>School</th>
              <th>Country</th>
              <th>Position</th>
              <th>Gross Pay</th>
              <th>Date</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id} className={selected.has(sub.id) ? 'row-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(sub.id)}
                    onChange={() => toggleSelect(sub.id)}
                  />
                </td>
                <td className="cell-school">{sub.schools?.name || sub.new_school_name}</td>
                <td>{sub.schools?.countries?.name || sub.new_school_country}</td>
                <td>{getPositionLabel(sub.position)}</td>
                <td className="cell-salary">
                  {formatCurrency(sub[`gross_${field}`], currency)}
                  {sub.local_currency_code && sub.local_currency_code !== currency && (
                    <span className="cell-local">{formatCurrency(sub.gross_local, sub.local_currency_code)}</span>
                  )}
                </td>
                <td className="cell-date">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                <td className="cell-ip">
                  {sub.vpn_flagged && <span className="vpn-badge">VPN</span>}
                  {sub.ip_address || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
