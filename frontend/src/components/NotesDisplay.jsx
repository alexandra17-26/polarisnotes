import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotesDisplay.css';

function NotesDisplay({ notes, transcription, mode, isProcessing, noteId, onUpdateNote, insights }) {
  const [activeTab, setActiveTab] = useState('notes');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedNotes(notes);
  }, [notes]);

  if (isProcessing) {
    return (
      <div className="notes-display">
        <h2 className="section-title">
          Notes
        </h2>
        <div className="processing-state">
          <div className="spinner"></div>
          <p>Generating your notes...</p>
        </div>
      </div>
    );
  }

  if (!notes && !transcription) {
    return (
      <div className="notes-display">
        <h2 className="section-title">
          Notes
        </h2>
        <div className="empty-state">
          <h3>Ready to Generate Notes</h3>
          <p>Record audio or upload a file to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-display">
      <h2 className="section-title">
        Notes
      </h2>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Generated Notes
        </button>
        <button
          className={`tab ${activeTab === 'transcript' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcript')}
        >
          Full Transcript
        </button>
      </div>

      <div className="notes-content">
        {activeTab === 'notes' ? (
          <div className="notes-text">
            <div className="mode-badge">
              Mode: {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
            </div>
            {isEditing ? (
              <textarea
                className="notes-edit"
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
              />
            ) : (
              <pre className="notes-pre">{notes}</pre>
            )}
          </div>
        ) : (
          <div className="transcript-text">
            <div className="mode-badge">Raw Transcription</div>
            <pre className="transcript-pre">{transcription}</pre>
          </div>
        )}
      </div>

      {insights && (
        <div className="note-insights">
          <h3 className="insights-title">Insights</h3>
          {insights.topics && insights.topics.length > 0 && (
            <div className="insight-section">
              <h4>Topics</h4>
              <div className="insight-tags">
                {insights.topics.map((topic, i) => (
                  <span key={i} className="insight-tag">{topic}</span>
                ))}
              </div>
            </div>
          )}
          {insights.action_items && insights.action_items.length > 0 && (
            <div className="insight-section">
              <h4>Action Items</h4>
              <ul className="action-items-list">
                {insights.action_items.map((item, i) => (
                  <li key={i}>
                    {typeof item === 'string' ? item : item.task}
                    {item.assignee && <span className="assignee"> - {item.assignee}</span>}
                    {item.deadline && <span className="deadline"> ({item.deadline})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insights.dates && insights.dates.length > 0 && (
            <div className="insight-section">
              <h4>Important Dates</h4>
              <ul className="dates-list">
                {insights.dates.map((date, i) => (
                  <li key={i}>{date}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="notes-actions">
        {noteId && (
          <>
            <button
              className="action-button"
              onClick={() => setIsEditing(!isEditing)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </button>
            {isEditing && (
              <button
                className="action-button save-btn"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await axios.put(`/api/notes/${noteId}`, { notes: editedNotes });
                    if (onUpdateNote) onUpdateNote({ ...notes, notes: editedNotes });
                    setIsEditing(false);
                  } catch (error) {
                    console.error('Error saving note:', error);
                    alert('Failed to save note');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
          </>
        )}
        <button
          className="action-button"
          onClick={() => {
            const text = activeTab === 'notes' ? (isEditing ? editedNotes : notes) : transcription;
            navigator.clipboard.writeText(text);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </button>
        {noteId ? (
          <>
            <button
              className="action-button"
              onClick={() => window.open(`/api/notes/${noteId}/export/markdown`, '_blank')}
            >
              Export MD
            </button>
            <button
              className="action-button"
              onClick={() => window.open(`/api/notes/${noteId}/export/txt`, '_blank')}
            >
              Export TXT
            </button>
            <button
              className="action-button share-btn"
              onClick={async () => {
                try {
                  const response = await axios.post(`/api/notes/${noteId}/share`);
                  const shareUrl = response.data.shareUrl;
                  await navigator.clipboard.writeText(shareUrl);
                  alert('Share link copied to clipboard!');
                } catch (error) {
                  console.error('Error sharing note:', error);
                  alert('Failed to create share link');
                }
              }}
            >
              Share
            </button>
          </>
        ) : (
          <button
            className="action-button"
            onClick={() => {
              const text = activeTab === 'notes' ? notes : transcription;
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `notes-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        )}
      </div>
    </div>
  );
}

export default NotesDisplay;
