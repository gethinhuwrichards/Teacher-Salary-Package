import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import './AdminVisitorIpsPage.css';

export default function AdminVisitorIpsPage() {
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  // IP breakdown modal state
  const [ipBreakdown, setIpBreakdown] = useState(null);
  const [ipBreakdownLoading, setIpBreakdownLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    loadVisitors();
  }, []);

  async function loadVisitors() {
    setLoading(true);
    try {
      const data = await api.getVisitorIps();
      setVisitors(data);
    } catch (err) {
      if (err.message === 'Unauthorized' || err.message === 'Invalid or expired session') {
        localStorage.removeItem('adminToken');
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleIpLookup(ip) {
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

  if (loading) {
    return <div className="loading">Loading visitor IPs...</div>;
  }

  return (
    <div className="admin-visitors">
      <div className="admin-header">
        <h1>Visitor IPs ({visitors.length})</h1>
        <div className="admin-nav">
          <Link to="/admin/review" className="btn btn-primary btn-sm">Review Queue</Link>
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

      {visitors.length === 0 && (
        <div className="empty-state">No visitor IPs recorded yet.</div>
      )}

      {visitors.length > 0 && (
        <div className="visitors-table-wrap">
          <table className="visitors-table">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>First Seen</th>
                <th>Last Seen</th>
                <th>Visits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (
                <tr key={v.id}>
                  <td className="cell-ip-mono">{v.ip_address}</td>
                  <td className="cell-date">{new Date(v.first_seen).toLocaleString()}</td>
                  <td className="cell-date">{new Date(v.last_seen).toLocaleString()}</td>
                  <td className="cell-visits">{v.visit_count}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => handleIpLookup(v.ip_address)}
                    >
                      Lookup
                    </button>
                  </td>
                </tr>
              ))}
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
