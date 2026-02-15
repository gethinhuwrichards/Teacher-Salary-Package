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

  if (loading) {
    return <div className="loading">Loading submissions...</div>;
  }

  return (
    <div className="admin-review">
      <div className="admin-header">
        <h1>Review Queue ({submissions.length})</h1>
        <div className="admin-nav">
          <Link to="/admin/past" className="btn btn-secondary btn-sm">Past Submissions</Link>
          <Link to="/admin/archived" className="btn btn-secondary btn-sm">Archived</Link>
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

      <div className="admin-submissions">
        {submissions.map((sub) => {
          const isNewSchool = !sub.school_id && sub.new_school_name;
          const isActioning = actionLoading[sub.id];

          return (
            <div
              key={sub.id}
              className={`admin-card ${isNewSchool ? 'new-school' : ''}`}
            >
              {isNewSchool && <div className="new-school-badge">NEW SCHOOL</div>}

              <div className="admin-card-header">
                <div>
                  <h3>
                    {sub.schools?.name || sub.new_school_name}
                  </h3>
                  <span className="card-meta">
                    {sub.schools?.countries?.name || sub.new_school_country} · {getPositionLabel(sub.position)} · {new Date(sub.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="admin-card-body">
                <div className="detail-grid">
                  <div>
                    <span className="detail-label">Gross Pay</span>
                    <span className="detail-value">{formatCurrency(sub[`gross_${field}`], currency)}</span>
                    {sub.local_currency_code !== currency && (
                      <span className="detail-sub">{formatCurrency(sub.gross_local, sub.local_currency_code)}</span>
                    )}
                  </div>

                  <div>
                    <span className="detail-label">Accommodation</span>
                    <span className="detail-value">
                      {sub.accommodation_type === 'allowance'
                        ? `Allowance: ${formatCurrency(sub[`accommodation_${field}`], currency)}`
                        : sub.accommodation_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {sub.net_pay && (
                    <div>
                      <span className="detail-label">Net Pay</span>
                      <span className="detail-value">{formatCurrency(sub[`net_${field}`], currency)}</span>
                    </div>
                  )}

                  {sub.tax_not_applicable && (
                    <div>
                      <span className="detail-label">Tax</span>
                      <span className="detail-value">N/A</span>
                    </div>
                  )}

                  {sub.pension_offered && (
                    <div>
                      <span className="detail-label">Pension</span>
                      <span className="detail-value">{sub.pension_percentage ? `${sub.pension_percentage}%` : 'Yes'}</span>
                    </div>
                  )}

                  {sub.child_places && (
                    <div>
                      <span className="detail-label">Child Places</span>
                      <span className="detail-value">{sub.child_places}{sub.child_places_detail ? ` — ${sub.child_places_detail}` : ''}</span>
                    </div>
                  )}

                  {sub.medical_insurance && (
                    <div>
                      <span className="detail-label">Medical</span>
                      <span className="detail-value">Yes{sub.medical_insurance_detail ? ` — ${sub.medical_insurance_detail}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card-actions">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleAction(sub.id, 'approve')}
                  disabled={!!isActioning}
                >
                  {isActioning === 'approve' ? 'Approving...' : 'Approve'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleAction(sub.id, 'deny')}
                  disabled={!!isActioning}
                >
                  {isActioning === 'deny' ? 'Denying...' : 'Deny'}
                </button>

                {isNewSchool && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setMatchingId(matchingId === sub.id ? null : sub.id)}
                  >
                    Match to School
                  </button>
                )}
              </div>

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
                            className="btn btn-primary btn-sm"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
