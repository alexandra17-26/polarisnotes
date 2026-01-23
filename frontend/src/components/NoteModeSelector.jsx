import React from 'react';
import './NoteModeSelector.css';

function NoteModeSelector({ modes, selectedMode, onModeChange }) {
  return (
    <div className="mode-selector">
      <h2 className="section-title">
        Note Mode
      </h2>
      <div className="mode-grid">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className={`mode-card ${selectedMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
          >
            <div className="mode-icon">
              {mode.id === 'summary' && '✎'}
              {mode.id === 'detailed' && '◉'}
              {mode.id === 'bullet' && '○'}
              {mode.id === 'action-items' && '◈'}
              {mode.id === 'transcript' && '◐'}
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
