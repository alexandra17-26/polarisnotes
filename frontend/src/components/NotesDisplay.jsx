import React, { useState } from 'react';
import './NotesDisplay.css';

function NotesDisplay({ notes, transcription, mode, isProcessing }) {
  const [activeTab, setActiveTab] = useState('notes');

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
            <pre className="notes-pre">{notes}</pre>
          </div>
        ) : (
          <div className="transcript-text">
            <div className="mode-badge">Raw Transcription</div>
            <pre className="transcript-pre">{transcription}</pre>
          </div>
        )}
      </div>

      <div className="notes-actions">
        <button
          className="action-button"
          onClick={() => {
            const text = activeTab === 'notes' ? notes : transcription;
            navigator.clipboard.writeText(text);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy to Clipboard
        </button>
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
      </div>
    </div>
  );
}

export default NotesDisplay;
