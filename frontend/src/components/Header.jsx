import React from 'react';
import { Link } from 'react-router-dom';
import Instructions from './Instructions';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <Link to="/app" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
            <h1>Polaris Notes</h1>
          </Link>
          <p className="tagline">AI-Powered Note-Taking Intelligence</p>
        </div>
        <div className="header-right">
          {user && (
            <div className="header-user">
              <span className="header-user-name">{user.name || user.email}</span>
              <button type="button" className="header-signout" onClick={logout}>
                Sign out
              </button>
            </div>
          )}
          <div className="header-instructions">
            <Instructions />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
