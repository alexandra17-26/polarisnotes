import React, { useEffect, useState } from 'react';
import api from '../api';
import Header from '../components/Header';
import '../App.css';

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, usersRes] = await Promise.all([
          api.get('/api/admin/summary'),
          api.get('/api/admin/users'),
        ]);
        if (summaryRes.data?.success) {
          setSummary(summaryRes.data.data);
        }
        if (usersRes.data?.success && Array.isArray(usersRes.data.users)) {
          setUsers(usersRes.data.users);
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Failed to load admin data. Make sure you are logged in as an admin.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="admin-dashboard">
            <div className="admin-header-row">
              <p className="admin-kicker">Owner</p>
              <h1 className="admin-title">Admin dashboard</h1>
              <p className="admin-subtitle">
                Users, notes, and recent activity — same look as the rest of Polaris Notes.
              </p>
            </div>

            {loading && (
              <div className="admin-loading">
                <div className="auth-loading-spinner" />
                <p>Loading admin data…</p>
              </div>
            )}

            {error && !loading && (
              <div className="admin-error-banner">
                {error}
              </div>
            )}

            {!loading && summary && (
              <>
                <section className="admin-section">
                  <h2 className="admin-section-title">Key metrics</h2>
                  <div className="admin-stat-grid">
                    <StatCard label="Total users" value={summary.userCount} />
                    <StatCard label="Total notes" value={summary.noteCount} />
                    <StatCard
                      label="Top user notes (last 7 days)"
                      value={
                        summary.topUsersByNotes?.[0]
                          ? `${summary.topUsersByNotes[0].noteCount} notes`
                          : '—'
                      }
                    />
                  </div>
                </section>

                <section className="admin-section">
                  <h2 className="admin-section-title">Recent activity (last 7 days)</h2>
                  <div className="admin-activity-grid">
                    <div className="admin-activity-column">
                      <h3 className="admin-activity-title">New users per day</h3>
                      <div className="admin-activity-list">
                        {summary.usersLast7Days?.map((row) => (
                          <div key={row.date} className="admin-activity-row">
                            <span className="admin-activity-date">{row.date}</span>
                            <span className="admin-activity-count">{row.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="admin-activity-column">
                      <h3 className="admin-activity-title">New notes per day</h3>
                      <div className="admin-activity-list">
                        {summary.notesLast7Days?.map((row) => (
                          <div key={row.date} className="admin-activity-row">
                            <span className="admin-activity-date">{row.date}</span>
                            <span className="admin-activity-count">{row.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="admin-section">
                  <h2 className="admin-section-title">Users</h2>
                  <div className="admin-users-table-wrapper">
                    <table className="admin-users-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Provider</th>
                          <th>Notes</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name || '—'}</td>
                            <td>{user.email || '—'}</td>
                            <td>{user.provider}</td>
                            <td>{user.noteCount}</td>
                            <td>{formatDate(user.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

