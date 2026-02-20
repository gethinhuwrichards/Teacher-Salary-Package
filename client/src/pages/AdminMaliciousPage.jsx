import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import { getPositionLabel } from '../utils/constants';
import './AdminMaliciousPage.css';

export default function AdminMaliciousPage() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const field = getCurrencyField(currency);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadMalicious();
  }, []);

  async function loadMalicious() {
    setLoading(true);
    try {
      const data = await api.getAdminSubmissions('denied', true);
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

  async function handleRestore(id) {
    setRestoring(prev => ({ ...prev, [id]: true }));
    try {
      await api.restoreSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(`Failed to restore: ${err.message}`);
    } finally {
      setRestoring(prev => ({ ...prev, [id]: false }));
    }
  }

  if (loading) {
    return <div className="loading">Loading malicious submissions...</div>;
  }

  return (
    <div className="admin-malicious">
      <div className="admin-header">
        <h1>Malicious IP ({submissions.length})</h1>
        <div className="admin-nav">
          <Link to="/admin/review" className="btn btn-primary btn-sm">Review Queue</Link>
          <Link to="/admin/past" className="btn btn-secondary btn-sm">Accepted Submissions</Link>
          <Link to="/admin/archived" className="btn btn-secondary btn-sm">Archived</Link>
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
        <div className="empty-state">No denied VPN-flagged submissions.</div>
      )}

      <div className="admin-submissions">
        {submissions.map((sub) => (
          <div key={sub.id} className="admin-card malicious-card">
            <div className="admin-card-header">
              <div>
                <h3>
                  <span className="vpn-badge">VPN</span>
                  {sub.schools?.name || sub.new_school_name}
                </h3>
                <span className="card-meta">
                  {sub.schools?.countries?.name || sub.new_school_country} · {getPositionLabel(sub.position)} · Denied {new Date(sub.reviewed_at).toLocaleDateString()}{sub.ip_address ? ` · IP: ${sub.ip_address}` : ''}
                </span>
              </div>
            </div>

            <div className="admin-card-body">
              <div className="detail-grid">
                <div>
                  <span className="detail-label">Gross Pay</span>
                  <span className="detail-value">{formatCurrency(sub[`gross_${field}`], currency)}</span>
                </div>
                <div>
                  <span className="detail-label">Accommodation</span>
                  <span className="detail-value">
                    {sub.accommodation_type === 'allowance'
                      ? `Allowance: ${formatCurrency(sub[`accommodation_${field}`], currency)}`
                      : sub.accommodation_type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-card-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleRestore(sub.id)}
                disabled={restoring[sub.id]}
              >
                {restoring[sub.id] ? 'Restoring...' : 'Restore to Queue'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
