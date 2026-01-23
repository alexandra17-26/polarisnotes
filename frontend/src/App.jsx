import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AudioRecorder from './components/AudioRecorder';
import NoteModeSelector from './components/NoteModeSelector';
import NotesDisplay from './components/NotesDisplay';
import './App.css';

function App() {
  const [noteMode, setNoteMode] = useState('detailed');
  const [notes, setNotes] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modes, setModes] = useState([]);

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
            </div>
            <div className="right-panel">
              <NotesDisplay
                notes={notes}
                transcription={transcription}
                mode={noteMode}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
