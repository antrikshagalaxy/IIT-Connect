import { useState } from 'react';
import AdminNavbar from './components/AdminNavbar';
import AdminDashboard from './pages/AdminDashboard';
import { api } from './services/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('iit_connect_admin_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await api.adminLogin(password);
      if (res?.data?.token) {
        localStorage.setItem('iit_connect_admin_token', res.data.token);
        setToken(res.data.token);
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid password');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('iit_connect_admin_token');
    setToken('');
    setPassword('');
  };

  return (
    <>
      <AdminNavbar isAuthenticated={!!token} onLogout={handleLogout} />
      <main className="main-content">
        {!token ? (
          <div className="container">
            <div className="card admin-login-box">
              <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Admin Access</h2>
              <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                Restricted portal for IIT Connect team management.
              </p>

              {loginError && <div className="alert alert-error">{loginError}</div>}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-pass">
                    Admin Password
                  </label>
                  <input
                    id="admin-pass"
                    type="password"
                    required
                    className="form-control"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loggingIn || !password}
                  className="btn btn-primary btn-block"
                >
                  {loggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <AdminDashboard onLogout={handleLogout} />
        )}
      </main>
    </>
  );
}
