import './AdminNavbar.css';

export default function AdminNavbar({ isAuthenticated, onLogout }) {
  return (
    <header className="admin-nav">
      <div className="container admin-nav-inner">
        <div className="admin-nav-brand">
          <span>IIT Connect</span>
          <span className="admin-badge-portal">Internal Operations</span>
        </div>

        <div className="admin-nav-actions">
          {isAuthenticated && (
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
