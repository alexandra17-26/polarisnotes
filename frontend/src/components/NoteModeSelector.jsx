import React from 'react';
import './NoteModeSelector.css';

const FALLBACK_MODES = [
  { id: 'summary', name: 'Summary', description: 'Concise overview of key points' },
  { id: 'detailed', name: 'Detailed', description: 'Comprehensive notes with full context' },
  { id: 'bullet', name: 'Bullet Points', description: 'Organized bullet points for meetings' },
  { id: 'action-items', name: 'Action Items', description: 'Focus on tasks and action items' },
  { id: 'notes-only', name: 'Notes Only', description: 'Generate notes without transcript' },
  { id: 'transcript', name: 'Full Transcript', description: 'Complete verbatim transcription' },
];

function NoteModeSelector({ modes, selectedMode, onModeChange }) {
  const list = Array.isArray(modes) && modes.length > 0 ? modes : FALLBACK_MODES;
  return (
    <div className="mode-selector">
      <h2 className="section-title">
        Note Mode
      </h2>
      <div className="mode-grid">
        {list.map((mode) => (
          <button
            key={mode.id}
            className={`mode-card ${selectedMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
          >
            <div className={`mode-icon ${mode.id === 'bullet' || mode.id === 'notes-only' ? 'icon-large' : ''}`}>
              {mode.id === 'summary' && '✎'}
              {mode.id === 'detailed' && '◉'}
              {mode.id === 'bullet' && '•'}
              {mode.id === 'action-items' && '◈'}
              {mode.id === 'notes-only' && '○'}
              {mode.id === 'transcript' && '◐'}
              {(mode.isCustom || String(mode.id).startsWith('custom-')) && '◇'}
            </div>
            <div className="mode-info">
              <h3>{mode.name}</h3>
              <p>{mode.description}</p>
            </div>
            {selectedMode === mode.id && (
              <div className="active-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default NoteModeSelector;
