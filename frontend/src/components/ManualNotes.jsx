import React, { useState } from 'react';
import axios from 'axios';
import './ManualNotes.css';

function ManualNotes({ onNotesGenerated, onProcessingStart, onProcessingStop }) {
  const [manualNotes, setManualNotes] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!manualNotes.trim()) {
      alert('Please enter some notes before saving.');
      return;
    }

    setSaving(true);
    onProcessingStart();

    try {
      // Save the manual notes directly without transcription
      const response = await axios.post('/api/notes', {
        title: title || `Manual Note ${new Date().toLocaleString()}`,
        notes: manualNotes,
        transcription: null, // No transcription for manual notes
        mode: 'manual',
        category: category || null,
        tags: []
      });

      // Simulate the notes generated callback
      onNotesGenerated({
        notes: manualNotes,
        transcription: null,
        mode: 'manual',
        noteId: response.data.noteId
      });

      // Clear the form
      setManualNotes('');
      setTitle('');
      setCategory('');

      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving manual notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
      onProcessingStop();
    }
  };

  return (
    <div className="manual-notes">
      <h2 className="section-title">
        Manual Notes
      </h2>
      <p className="manual-notes-description">
        Type your notes directly without audio transcription
      </p>

      <div className="manual-notes-form">
        <div className="form-group">
          <label>Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Meeting Notes, Study Notes"
            className="title-input"
          />
        </div>

        <div className="form-group">
          <label>Category (Optional)</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="">None</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="meeting">Meeting</option>
            <option value="lecture">Lecture</option>
            <option value="study">Study</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Your Notes</label>
            <textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Type your notes here..."
              className="notes-textarea"
              rows="6"
            />
          <div className="char-count">
            {manualNotes.length} characters
          </div>
        </div>

        <button
          className="save-manual-notes-btn"
          onClick={handleSave}
          disabled={saving || !manualNotes.trim()}
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
}

export default ManualNotes;
