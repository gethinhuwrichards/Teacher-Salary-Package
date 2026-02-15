import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency, getCurrencyField } from '../utils/formatCurrency';
import { getPositionLabel } from '../utils/constants';
import './AdminArchivedPage.css';

export default function AdminArchivedPage() {
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
    loadArchived();
  }, []);

  async function loadArchived() {
    setLoading(true);
    try {
      const data = await api.getAdminSubmissions('denied');
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
    return <div className="loading">Loading archived submissions...</div>;
  }

  return (
    <div className="admin-archived">
      <div className="admin-header">
        <h1>Archived Submissions ({submissions.length})</h1>
        <div className="admin-nav">
          <Link to="/admin/review" className="btn btn-primary btn-sm">Review Queue</Link>
          <Link to="/admin/past" className="btn btn-secondary btn-sm">Past Submissions</Link>
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
        <div className="empty-state">No archived submissions.</div>
      )}

      <div className="admin-submissions">
        {submissions.map((sub) => (
          <div key={sub.id} className="admin-card archived-card">
            <div className="admin-card-header">
              <div>
                <h3>{sub.schools?.name || sub.new_school_name}</h3>
                <span className="card-meta">
                  {sub.schools?.countries?.name || sub.new_school_country} · {getPositionLabel(sub.position)} · Denied {new Date(sub.reviewed_at).toLocaleDateString()}
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
