import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import { getPositionLabel } from '../utils/constants';
import './AdminReviewPage.css';

export default function AdminReviewPage() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const field = getCurrencyField(currency);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Match school state
  const [matchingId, setMatchingId] = useState(null);
  const [matchQuery, setMatchQuery] = useState('');
  const [matchResults, setMatchResults] = useState([]);
  const [matchSearching, setMatchSearching] = useState(false);

  // Edit school name state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const data = await api.getAdminSubmissions('pending');
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

  async function handleAction(id, action) {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    try {
      await api.reviewSubmission(id, action);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(`Failed to ${action}: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  }

  async function handleMatchSearch(query) {
    setMatchQuery(query);
    if (query.length < 2) {
      setMatchResults([]);
      return;
    }
    setMatchSearching(true);
    try {
      const results = await api.searchSchools(query);
      setMatchResults(results);
    } catch {
      setMatchResults([]);
    } finally {
      setMatchSearching(false);
    }
  }

  async function handleMatchSchool(submissionId, schoolId) {
    try {
      await api.matchSchool(submissionId, schoolId);
      setMatchingId(null);
      setMatchQuery('');
      setMatchResults([]);
      loadSubmissions();
    } catch (err) {
      alert(`Failed to match: ${err.message}`);
    }
  }

  async function handleEditSchoolName(id) {
    if (!editName.trim()) return;
    try {
      await api.editSchoolName(id, editName.trim());
      setSubmissions(prev =>
        prev.map(s => s.id === id ? { ...s, new_school_name: editName.trim() } : s)
      );
      setEditingId(null);
      setEditName('');
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    }
  }

  function formatAccommodation(sub) {
    if (sub.accommodation_type === 'allowance') {
      return `Allowance: ${formatCurrency(sub[`accommodation_${field}`], currency)}`;
    }
    return sub.accommodation_type.replace(/_/g, ' ');
  }

  function formatBenefits(sub) {
    const parts = [];
    if (sub.pension_offered) parts.push(sub.pension_percentage ? `Pension ${sub.pension_percentage}%` : 'Pension');
    if (sub.child_places) parts.push(`Children: ${sub.child_places}${sub.child_places_detail ? ` (${sub.child_places_detail})` : ''}`);
    if (sub.medical_insurance) parts.push(`Medical${sub.medical_insurance_detail ? ` (${sub.medical_insurance_detail})` : ''}`);
    if (sub.tax_not_applicable) parts.push('No tax');
    return parts.length > 0 ? parts.join(', ') : '—';
  }

  if (loading) {
    return <div className="loading">Loading submissions...</div>;
  }

  return (
    <div className="admin-review">
      <div className="admin-header">
        <h1>Review Queue ({submissions.length})</h1>
        <div className="admin-nav">
          <Link to="/admin/past" className="btn btn-secondary btn-sm">Accepted Submissions</Link>
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

      {submissions.length === 0 && (
        <div className="empty-state">No pending submissions to review.</div>
      )}

      {submissions.length > 0 && (
        <div className="review-table-wrap">
          <table className="review-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Country</th>
                <th>Position</th>
                <th>Gross</th>
                <th>Net</th>
                <th>Accommodation</th>
                <th>Benefits</th>
                <th>Date</th>
                <th>IP</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const isNewSchool = !sub.school_id && sub.new_school_name;
                const isActioning = actionLoading[sub.id];
                const schoolName = sub.schools?.name || sub.new_school_name;
                const country = sub.schools?.countries?.name || sub.new_school_country;
                const expanded = matchingId === sub.id || editingId === sub.id;

                return (
                  <tr key={sub.id} className={[
                    isNewSchool ? 'new-school-row' : '',
                    sub.vpn_flagged ? 'vpn-flagged-row' : '',
                  ].filter(Boolean).join(' ')}>
                    <td className="col-school">
                      {editingId === sub.id ? (
                        <div className="edit-name-row">
                          <input
                            type="text"
                            className="form-input edit-name-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSchoolName(sub.id)}
                          />
                          <button className="btn btn-primary btn-xs" onClick={() => handleEditSchoolName(sub.id)}>Save</button>
                          <button className="btn btn-secondary btn-xs" onClick={() => { setEditingId(null); setEditName(''); }}>Cancel</button>
                        </div>
                      ) : (
                        <div className="school-cell">
                          {isNewSchool && <span className="new-badge">NEW</span>}
                          <span className="school-name">{schoolName}</span>
                          {isNewSchool && (
                            <button
                              className="btn-edit-name"
                              onClick={() => { setEditingId(sub.id); setEditName(sub.new_school_name); }}
                              title="Edit school name"
                            >
                              ✎
                            </button>
                          )}
                        </div>
                      )}
                      {matchingId === sub.id && (
                        <div className="match-panel">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Search for existing school..."
                            value={matchQuery}
                            onChange={(e) => handleMatchSearch(e.target.value)}
                          />
                          {matchSearching && <span className="match-loading">Searching...</span>}
                          {matchResults.length > 0 && (
                            <ul className="match-results">
                              {matchResults.map((school) => (
                                <li key={school.id} className="match-item">
                                  <span>{school.name} ({school.countries?.name})</span>
                                  <button
                                    className="btn btn-primary btn-xs"
                                    onClick={() => handleMatchSchool(sub.id, school.id)}
                                  >
                                    Match
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{country}</td>
                    <td>{getPositionLabel(sub.position)}</td>
                    <td className="col-money">
                      <span>{formatCurrency(sub[`gross_${field}`], currency)}</span>
                      {sub.local_currency_code !== currency && (
                        <span className="sub-amount">{formatCurrency(sub.gross_local, sub.local_currency_code)}</span>
                      )}
                    </td>
                    <td className="col-money">
                      {sub.net_pay ? formatCurrency(sub[`net_${field}`], currency) : '—'}
                    </td>
                    <td>{formatAccommodation(sub)}</td>
                    <td className="col-benefits">{formatBenefits(sub)}</td>
                    <td className="col-date">{new Date(sub.submitted_at).toLocaleDateString()}</td>
                    <td className="col-ip">
                      {sub.vpn_flagged && <span className="vpn-badge">VPN</span>}
                      {sub.ip_address || '—'}
                    </td>
                    <td className="col-actions">
                      <button
                        className="btn btn-success btn-xs"
                        onClick={() => handleAction(sub.id, 'approve')}
                        disabled={!!isActioning}
                      >
                        {isActioning === 'approve' ? '...' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => handleAction(sub.id, 'deny')}
                        disabled={!!isActioning}
                      >
                        {isActioning === 'deny' ? '...' : 'Deny'}
                      </button>
                      {isNewSchool && (
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => setMatchingId(matchingId === sub.id ? null : sub.id)}
                        >
                          Match
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
