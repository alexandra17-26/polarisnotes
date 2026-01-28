import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import AudioRecorder from './components/AudioRecorder';
import NoteModeSelector from './components/NoteModeSelector';
import NotesDisplay from './components/NotesDisplay';
import NoteHistory from './components/NoteHistory';
import CustomModes from './components/CustomModes';
import './App.css';

function App() {
  const [noteMode, setNoteMode] = useState('detailed');
  const [notes, setNotes] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modes, setModes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [insights, setInsights] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchModes();
  }, []);

  const fetchModes = async () => {
    try {
      const response = await fetch('/api/modes');
      const data = await response.json();
      setModes(data.modes);
    } catch (error) {
      console.error('Error fetching modes:', error);
    }
  };

  const handleNotesGenerated = (data) => {
    setNotes(data.notes);
    setTranscription(data.transcription);
    setIsProcessing(false);
    setCurrentNoteId(data.noteId || null);
    setSelectedNoteId(data.noteId || null);
    
    // Fetch insights if noteId exists
    if (data.noteId) {
      fetchNoteInsights(data.noteId);
    }
  };

  const fetchNoteInsights = async (noteId) => {
    try {
      const response = await axios.get(`/api/notes/${noteId}`);
      if (response.data.insights) {
        setInsights(response.data.insights);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const handleSelectNote = async (note) => {
    if (!note) {
      setSelectedNoteId(null);
      setNotes(null);
      setTranscription(null);
      setInsights(null);
      return;
    }
    
    setSelectedNoteId(note.id);
    setCurrentNoteId(note.id);
    setNotes(note.notes);
    setTranscription(note.transcription);
    setNoteMode(note.mode);
    
    // Fetch insights
    await fetchNoteInsights(note.id);
  };

  const handleUpdateNote = (updatedNote) => {
    setNotes(updatedNote.notes);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setNotes(null);
    setTranscription(null);
  };

  const handleProcessingStop = () => {
    setIsProcessing(false);
  };

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="content-grid">
            <div className="left-panel">
              <NoteModeSelector
                modes={modes}
                selectedMode={noteMode}
                onModeChange={setNoteMode}
              />
              <AudioRecorder
                noteMode={noteMode}
                onNotesGenerated={handleNotesGenerated}
                onProcessingStart={handleProcessingStart}
                onProcessingStop={handleProcessingStop}
                isProcessing={isProcessing}
              />
              <div className="history-toggle">
                <button
                  className="toggle-history-btn"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide' : 'Show'} Note History
                </button>
              </div>
              {showHistory && (
                <NoteHistory
                  onSelectNote={handleSelectNote}
                  selectedNoteId={selectedNoteId}
                />
              )}
              <CustomModes
                onSelectCustomMode={(mode) => {
                  setNoteMode(`custom-${mode.id}`);
                }}
              />
            </div>
            <div className="right-panel">
              <NotesDisplay
                notes={notes}
                transcription={transcription}
                mode={noteMode}
                isProcessing={isProcessing}
                noteId={currentNoteId}
                insights={insights}
                onUpdateNote={handleUpdateNote}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
