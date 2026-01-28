import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NoteHistory.css';

function NoteHistory({ onSelectNote, selectedNoteId }) {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [category, searchQuery]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (category) params.category = category;
      
      const response = await axios.get('/api/notes', { params });
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`/api/notes/${id}`);
        fetchNotes();
        if (selectedNoteId === id) {
          onSelectNote(null);
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="note-history">
      <div className="history-header">
        <h2 className="section-title">Note History</h2>
        <div className="history-controls">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-filter"
          >
            <option value="">All Categories</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="meeting">Meeting</option>
            <option value="lecture">Lecture</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="notes-list">
        {loading ? (
          <div className="loading-state">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="empty-history">
            <p>No notes yet. Start recording to create your first note!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`note-item ${selectedNoteId === note.id ? 'selected' : ''}`}
              onClick={() => onSelectNote(note)}
            >
              <div className="note-item-header">
                <h3>{note.title || `Note ${note.id}`}</h3>
                <div className="note-item-actions">
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(note.id, e)}
                    title="Delete note"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="note-item-meta">
                <span className="note-mode">{note.mode}</span>
                <span className="note-date">{formatDate(note.created_at)}</span>
              </div>
              <p className="note-preview">
                {note.notes.substring(0, 150)}
                {note.notes.length > 150 ? '...' : ''}
              </p>
              {note.category && (
                <span className="note-category">{note.category}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NoteHistory;
