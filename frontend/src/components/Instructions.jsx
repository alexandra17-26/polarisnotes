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
            <p>Click "Show Note History" to view and manage all your saved notes.</p>
            <ul>
              <li>View all your saved notes in chronological order</li>
              <li>Click any note to view and edit it</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>6. Smart Search</h3>
            <p>Use the search bar in Note History to find notes quickly:</p>
            <ul>
              <li><strong>What it searches:</strong> The search looks through note titles, note content, full transcripts, tags, and insights (topics, action items, important dates, key points)</li>
              <li><strong>How to use:</strong> Type any keyword or phrase in the search box. Results update as you type</li>
              <li><strong>Examples:</strong> Search for "meeting", "deadline", a person's name, or any topic mentioned in your notes</li>
              <li><strong>Tip:</strong> The search is case-insensitive and finds partial matches, so you don't need to type exact words</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>7. Folders</h3>
            <p>Organize your notes into folders to keep them organized:</p>
            <ul>
              <li><strong>Assigning folders:</strong> When creating notes, use the "Folder (Optional)" dropdown in Manual Notes to assign a folder (Work, Personal, Meeting, Lecture, Study, or Other)</li>
              <li><strong>Filtering by folder:</strong> In Note History, use the folder dropdown to filter notes. Select "All Folders" to see everything, or choose a specific folder to see only notes in that folder</li>
              <li><strong>Important:</strong> Only notes that were saved with a folder assigned will appear when you filter by that folder. Notes without a folder will only show up under "All Folders"</li>
              <li><strong>Tip:</strong> Use folders consistently (e.g., always put work meetings in "Work", class notes in "Lecture") to make finding notes easier</li>
            </ul>
          </div>

          <div className="instructions-section">
            <h3>8. Custom Note Modes</h3>
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
              <li>Combine search and folder filters to quickly find specific notes</li>
              <li>Manual notes don't require audio - just type and save</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Instructions;
