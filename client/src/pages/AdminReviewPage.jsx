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

  // IP breakdown modal state
  const [ipBreakdown, setIpBreakdown] = useState(null);
  const [ipBreakdownLoading, setIpBreakdownLoading] = useState(false);

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

  async function handleIpBreakdown(ip) {
    if (!ip) return;
    setIpBreakdownLoading(true);
    try {
      const data = await api.ipLookup(ip);
      setIpBreakdown(data);
    } catch (err) {
      alert(`IP lookup failed: ${err.message}`);
    } finally {
      setIpBreakdownLoading(false);
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
          <Link to="/admin/visitor-ips" className="btn btn-secondary btn-sm">Visitor IPs</Link>
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
                      <div className="ip-flags">
                        {sub.ip_is_vpn && <span className="ip-flag-badge flag-vpn">VPN</span>}
                        {sub.ip_is_tor && <span className="ip-flag-badge flag-tor">TOR</span>}
                        {sub.ip_is_proxy && <span className="ip-flag-badge flag-proxy">PROXY</span>}
                        {sub.ip_is_abuser && <span className="ip-flag-badge flag-abuser">ABUSER</span>}
                      </div>
                      <span className="ip-text">{sub.ip_address || '—'}</span>
                      {sub.ip_country && <span className="ip-country">{sub.ip_country}</span>}
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
                      {sub.ip_address && (
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleIpBreakdown(sub.ip_address)}
                        >
                          IP Info
                        </button>
                      )}
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

      {/* IP Breakdown Modal */}
      {(ipBreakdown || ipBreakdownLoading) && (
        <div className="ip-modal-overlay" onClick={() => { setIpBreakdown(null); setIpBreakdownLoading(false); }}>
          <div className="ip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ip-modal-header">
              <h2>IP Breakdown {ipBreakdown?.ip ? `— ${ipBreakdown.ip}` : ''}</h2>
              <button className="ip-modal-close" onClick={() => { setIpBreakdown(null); setIpBreakdownLoading(false); }}>&times;</button>
            </div>
            {ipBreakdownLoading ? (
              <div className="ip-modal-loading">Looking up IP...</div>
            ) : ipBreakdown && (
              <div className="ip-modal-body">
                <div className="ip-detail-section">
                  <h3>Flags</h3>
                  <div className="ip-detail-grid">
                    <div className="ip-detail-item">
                      <span className="ip-detail-label">VPN</span>
                      <span className={`ip-detail-value ${ipBreakdown.is_vpn ? 'flag-yes' : 'flag-no'}`}>{ipBreakdown.is_vpn ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="ip-detail-item">
                      <span className="ip-detail-label">Tor</span>
                      <span className={`ip-detail-value ${ipBreakdown.is_tor ? 'flag-yes' : 'flag-no'}`}>{ipBreakdown.is_tor ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="ip-detail-item">
                      <span className="ip-detail-label">Proxy</span>
                      <span className={`ip-detail-value ${ipBreakdown.is_proxy ? 'flag-yes' : 'flag-no'}`}>{ipBreakdown.is_proxy ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="ip-detail-item">
                      <span className="ip-detail-label">Abuser</span>
                      <span className={`ip-detail-value ${ipBreakdown.is_abuser ? 'flag-yes' : 'flag-no'}`}>{ipBreakdown.is_abuser ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="ip-detail-item">
                      <span className="ip-detail-label">Datacenter</span>
                      <span className={`ip-detail-value ${ipBreakdown.is_datacenter ? 'flag-yes' : 'flag-no'}`}>{ipBreakdown.is_datacenter ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="ip-detail-item">
                      <span className="ip-detail-label">Mobile</span>
                      <span className="ip-detail-value">{ipBreakdown.is_mobile ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {ipBreakdown.location && (
                  <div className="ip-detail-section">
                    <h3>Location</h3>
                    <div className="ip-detail-grid">
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Country</span>
                        <span className="ip-detail-value">{ipBreakdown.location.country} ({ipBreakdown.location.country_code})</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">City / State</span>
                        <span className="ip-detail-value">{[ipBreakdown.location.city, ipBreakdown.location.state].filter(Boolean).join(', ') || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Latitude</span>
                        <span className="ip-detail-value">{ipBreakdown.location.latitude ?? '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Longitude</span>
                        <span className="ip-detail-value">{ipBreakdown.location.longitude ?? '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Timezone</span>
                        <span className="ip-detail-value">{ipBreakdown.location.timezone || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Local Time</span>
                        <span className="ip-detail-value">{ipBreakdown.location.local_time ? new Date(ipBreakdown.location.local_time).toLocaleString() : '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {ipBreakdown.company && (
                  <div className="ip-detail-section">
                    <h3>Company / Network</h3>
                    <div className="ip-detail-grid">
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Name</span>
                        <span className="ip-detail-value">{ipBreakdown.company.name || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Domain</span>
                        <span className="ip-detail-value">{ipBreakdown.company.domain || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Type</span>
                        <span className="ip-detail-value">{ipBreakdown.company.type || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Abuser Score</span>
                        <span className="ip-detail-value">{ipBreakdown.company.abuser_score || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {ipBreakdown.asn && (
                  <div className="ip-detail-section">
                    <h3>ASN</h3>
                    <div className="ip-detail-grid">
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">ASN</span>
                        <span className="ip-detail-value">{ipBreakdown.asn.asn || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Org</span>
                        <span className="ip-detail-value">{ipBreakdown.asn.org || ipBreakdown.asn.descr || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">Route</span>
                        <span className="ip-detail-value">{ipBreakdown.asn.route || '—'}</span>
                      </div>
                      <div className="ip-detail-item">
                        <span className="ip-detail-label">ASN Abuser Score</span>
                        <span className="ip-detail-value">{ipBreakdown.asn.abuser_score || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
