import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomModes.css';

function CustomModes({ onSelectCustomMode }) {
  const [modes, setModes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    writing_style: ''
  });

  useEffect(() => {
    fetchCustomModes();
  }, []);

  const fetchCustomModes = async () => {
    try {
      const response = await axios.get('/api/custom-modes');
      setModes(response.data.modes || []);
    } catch (error) {
      console.error('Error fetching custom modes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/custom-modes', formData);
      setFormData({ name: '', description: '', prompt: '', writing_style: '' });
      setShowForm(false);
      fetchCustomModes();
    } catch (error) {
      console.error('Error saving custom mode:', error);
      alert('Failed to save custom mode');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this custom mode?')) {
      try {
        await axios.delete(`/api/custom-modes/${id}`);
        fetchCustomModes();
      } catch (error) {
        console.error('Error deleting custom mode:', error);
        alert('Failed to delete custom mode');
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          // Try to parse as JSON first (for structured templates)
          try {
            const json = JSON.parse(content);
            setFormData({
              name: json.name || '',
              description: json.description || '',
              prompt: json.prompt || content,
              writing_style: json.writing_style || ''
            });
          } catch {
            // If not JSON, treat as plain text prompt
            setFormData(prev => ({
              ...prev,
              prompt: content
            }));
          }
        } catch (error) {
          alert('Error reading file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="custom-modes">
      <div className="custom-modes-header">
        <h2 className="section-title">Custom Note Modes</h2>
        <button
          className="add-mode-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Custom Mode'}
        </button>
      </div>

      {showForm && (
        <form className="custom-mode-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mode Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Academic Paper Style"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this mode"
            />
          </div>
          <div className="form-group">
            <label>Prompt Template</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              required
              placeholder="Enter your custom prompt. Use {transcription} as a placeholder for the transcription text."
              rows="6"
            />
          </div>
          <div className="form-group">
            <label>Writing Style (Optional)</label>
            <textarea
              value={formData.writing_style}
              onChange={(e) => setFormData({ ...formData, writing_style: e.target.value })}
              placeholder="Describe the writing style (e.g., formal, casual, technical)"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Upload Template File</label>
            <input
              type="file"
              accept=".txt,.json,.md"
              onChange={handleFileUpload}
              className="file-input"
            />
            <small>Upload a text file with your prompt template or JSON with structured data</small>
          </div>
          <div className="form-actions">
            <button type="submit" className="save-btn">Save Custom Mode</button>
          </div>
        </form>
      )}

      <div className="custom-modes-list">
        {modes.length === 0 ? (
          <div className="empty-custom-modes">
            <p>No custom modes yet. Create one to get started!</p>
          </div>
        ) : (
          modes.map((mode) => (
            <div key={mode.id} className="custom-mode-item">
              <div className="mode-item-content">
                <h3>{mode.name}</h3>
                {mode.description && <p>{mode.description}</p>}
                {mode.writing_style && (
                  <span className="writing-style-badge">{mode.writing_style}</span>
                )}
              </div>
              <div className="mode-item-actions">
                <button
                  className="use-mode-btn"
                  onClick={() => onSelectCustomMode && onSelectCustomMode(mode)}
                >
                  Use
                </button>
                <button
                  className="delete-mode-btn"
                  onClick={(e) => handleDelete(mode.id, e)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CustomModes;
