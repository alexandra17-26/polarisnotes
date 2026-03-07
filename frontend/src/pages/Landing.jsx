import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
          <h1>Polaris Notes</h1>
        </div>
        <p className="landing-tagline">AI-Powered Note-Taking Intelligence</p>
        <nav className="landing-nav">
          <Link to="/signin" className="landing-btn landing-btn-secondary">Sign In</Link>
          <Link to="/signin?signup=1" className="landing-btn landing-btn-primary">Get Started</Link>
        </nav>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <h2 className="landing-hero-title">Turn speech into structured notes</h2>
          <p className="landing-hero-subtitle">
            Record meetings and ideas. Get summaries, action items, and transcripts—all in your own workspace.
          </p>
          <Link to="/signin?signup=1" className="landing-cta">Create free account</Link>
        </section>
        <section className="landing-features">
          <div className="landing-card">
            <div className="landing-card-icon-badge">1</div>
            <h3>Record & transcribe</h3>
            <p>Upload or record audio; get accurate transcripts and AI-generated notes.</p>
          </div>
          <div className="landing-card">
            <div className="landing-card-icon-badge">2</div>
            <h3>Multiple note modes</h3>
            <p>Summary, bullet points, action items, or full transcript—choose what you need.</p>
          </div>
          <div className="landing-card">
            <div className="landing-card-icon-badge">3</div>
            <h3>Your notes, your account</h3>
            <p>Sign in for a personal profile and history that stays with you.</p>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <p>Polaris Notes — Smarter note-taking, one account at a time.</p>
      </footer>
    </div>
  );
}

export default Landing;
