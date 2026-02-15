import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  const token = localStorage.getItem('adminToken');
  if (token) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>Admin Panel</h1>
          <p>You are already logged in.</p>
          <div className="admin-links">
            <button className="btn btn-primary" onClick={() => navigate('/admin/review')}>
              Review Queue
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/archived')}>
              Archived
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                localStorage.removeItem('adminToken');
                window.location.reload();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token } = await api.adminLogin(password);
      localStorage.setItem('adminToken', token);
      navigate('/admin/review');
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>Admin Login</h1>
        <p>Enter the admin password to access the review panel.</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-group">
          <input
            type="password"
            className="form-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
