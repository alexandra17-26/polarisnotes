import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './SignIn.css';

function SignIn() {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('signup') === '1';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState(isSignUp ? 'signup' : 'signin');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef(null);
  const identifierInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        const res = await api.post('/api/auth/register', {
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password,
          name: name.trim()
        });
        if (res.data?.token && res.data?.user) {
          login(res.data.user, res.data.token);
          navigate('/app', { replace: true });
        } else {
          setError(res.data?.error || 'Registration failed.');
        }
      } else {
        // Read from DOM refs so autofill/password manager values are always used
        const idVal = (identifierInputRef.current?.value ?? identifier).trim();
        const pwdVal = passwordInputRef.current?.value ?? password;
        if (!idVal || !pwdVal) {
          setError('Please enter your email or phone and password.');
          setSubmitting(false);
          return;
        }
        const payload = { identifier: idVal, password: pwdVal };
        const res = await api.post('/api/auth/login', payload);
        if (res.data?.token && res.data?.user) {
          login(res.data.user, res.data.token);
          navigate('/app', { replace: true });
        } else {
          setError(res.data?.error || 'Login failed.');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Initialize Google Sign-In button
  useEffect(() => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) return;
    if (typeof window === 'undefined' || !window.google || !googleButtonRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const res = await api.post('/api/auth/google', { idToken: response.credential });
            if (res.data?.token && res.data?.user) {
              login(res.data.user, res.data.token);
              navigate('/app', { replace: true });
            } else {
              setError(res.data?.error || 'Google sign-in failed.');
            }
          } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Google sign-in failed.';
            setError(msg);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 320,
      });
    } catch (e) {
      // Silent failure if GIS is not available
      // eslint-disable-next-line no-console
      console.error('Google Identity initialization failed', e);
    }
  }, [login, navigate]);

  return (
    <div className="signin-page">
      <div className="signin-card">
        <Link to="/" className="signin-logo">
          <div className="signin-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
          <span>Polaris Notes</span>
        </Link>
        <div className="signin-title-block">
          <h2 className="signin-title">
            {mode === 'signin' ? 'Login to your account.' : 'Create your account.'}
          </h2>
          <p className="signin-subtitle">
            Hello, {mode === 'signin' ? 'welcome back' : 'let’s set up your workspace'}.
          </p>
        </div>
        <div className="signin-tabs">
          <button
            type="button"
            className={`signin-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`signin-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>
        <form className="signin-form" onSubmit={handleSubmit}>
          {error && (
            <div className="signin-error-block">
              <div className="signin-error">{error}</div>
              {error === 'Invalid credentials.' && (
                <p className="signin-error-hint">
                  If you signed up on this site before, free hosting may reset accounts when the server restarts. Try <button type="button" className="signin-error-link" onClick={() => { setMode('signup'); setError(''); }}>Sign up</button> to create an account again.
                </p>
              )}
            </div>
          )}
          {mode === 'signup' && (
            <label className="signin-label">
              Name
              <input
                type="text"
                className="signin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}
          {mode === 'signup' ? (
            <>
              <label className="signin-label">
                Email
                <input
                  type="email"
                  className="signin-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="signin-label">
                Phone number
                <input
                  type="tel"
                  className="signin-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  autoComplete="tel"
                />
              </label>
            </>
          ) : (
            <label className="signin-label">
              Email or phone number
              <input
                ref={identifierInputRef}
                type="text"
                name="identifier"
                className="signin-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or +1 555 123 4567"
                autoComplete="username"
                required
              />
            </label>
          )}
          <label className="signin-label">
            <span className="signin-label-row">
              Password
              <button
                type="button"
                className="signin-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
            <input
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="signin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'Password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </label>
          <button type="submit" className="signin-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign In'}
          </button>
        </form>
        <div className="signin-divider">
          <span>or sign in with</span>
        </div>
        <div className="signin-social-row">
          <div ref={googleButtonRef} className="google-signin-placeholder" />
        </div>
        <p className="signin-footer">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="signin-link"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
      <p className="signin-back">
        <Link to="/">← Back to home</Link>
      </p>
    </div>
  );
}

export default SignIn;
