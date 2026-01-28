import React, { useState } from 'react';
import './Instructions.css';

function Instructions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="instructions-container">
      <button 
        className="instructions-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Hide Instructions' : 'Show Instructions'}
      >
        {isOpen && <span className="instructions-text">Hide Instructions</span>}
        {!isOpen && <span className="instructions-text">Instructions</span>}
      </button>

      {isOpen && (
        <div className="instructions-content">
          <h2 className="instructions-title">How to Use Polaris Notes</h2>
          
          <div className="instructions-section">
            <h3>1. Choose Your Note Mode</h3>
            <p>Select how you want your notes formatted:</p>
            <ul>
              <li><strong>Summary</strong> - Brief overview of key points</li>
              <li><strong>Detailed</strong> - Comprehensive notes with full context</li>
              <li><strong>Bullet Points</strong> - Organized bullets for meetings</li>
              <li><strong>Action Items</strong> - Focus on tasks and to-dos</li>
              <li><strong>Notes Only</strong> - Notes without transcript</li>
              <li><strong>Full Transcript</strong> - Complete word-for-word transcription</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>2. Record or Upload Audio</h3>
            <p>You have three options:</p>
            <ul>
              <li><strong>Start Recording</strong> - Click to record live audio (allows microphone access)</li>
              <li><strong>Upload Audio File</strong> - Upload MP3, WAV, M4A, or other audio formats</li>
              <li><strong>Manual Notes</strong> - Type notes directly without audio</li>
            </ul>
            <p className="tip"><strong>Tip:</strong> For video calls (Zoom, Google Meet), record the meeting separately and upload the audio file. Browser recording only captures your microphone, not meeting audio.</p>
          </div>

          <div className="instructions-section">
            <h3>3. View Your Notes</h3>
            <p>After processing, you'll see:</p>
            <ul>
              <li><strong>Generated Notes</strong> - Your formatted notes (switch tabs to see transcript if available)</li>
              <li><strong>Insights</strong> - Automatically extracted topics, action items, and important dates</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>4. Manage Your Notes</h3>
            <ul>
              <li><strong>Edit</strong> - Click "Edit" to modify your notes, then "Save"</li>
              <li><strong>Export</strong> - Download as Markdown (MD), Text (TXT), or PDF</li>
              <li><strong>Share</strong> - Copy formatted notes to clipboard</li>
              <li><strong>Copy</strong> - Quick copy of raw text</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>5. Note History</h3>
            <p>Click "Show Note History" to:</p>
            <ul>
              <li>View all your saved notes</li>
              <li>Search notes by content</li>
              <li>Filter by category (Work, Personal, Meeting, etc.)</li>
              <li>Click any note to view and edit it</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>6. Custom Note Modes</h3>
            <p>Create your own note templates:</p>
            <ul>
              <li>Scroll to "Custom Note Modes" section</li>
              <li>Click "+ Add Custom Mode"</li>
              <li>Enter a name, description, and prompt template</li>
              <li>Use <code>{'{transcription}'}</code> as a placeholder for the transcription</li>
              <li>Upload a text file with your template (optional)</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>Quick Tips</h3>
            <ul>
              <li>All notes are automatically saved to your history</li>
              <li>You can edit, export, and share any saved note</li>
              <li>Insights are generated automatically for each note</li>
              <li>Use categories to organize your notes</li>
              <li>Manual notes don't require audio - just type and save</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Instructions;
