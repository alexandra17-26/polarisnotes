import React, { useState, useRef, useEffect } from 'react';
import api from '../api';
import './AudioRecorder.css';

function AudioRecorder({ noteMode, onNotesGenerated, onProcessingStart, onProcessingStop, isProcessing }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Recording is not supported in this browser. Try Chrome or Safari (iOS 14.3+).');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Choose format: Safari (especially iOS) often doesn't support webm, so use default if needed
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }
      // Else leave options empty so browser uses its default (e.g. Safari uses mp4/aac)
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
          
          // Convert to a File with proper extension for OpenAI (Safari often uses mp4/m4a)
          let extension = 'webm';
          if (mimeType.includes('webm')) extension = 'webm';
          else if (mimeType.includes('mp4') || mimeType.includes('m4a')) extension = 'm4a';
          else if (mimeType.includes('ogg')) extension = 'oga';
          else if (mimeType.includes('wav')) extension = 'wav';
          const audioFile = new File([blob], `recording.${extension}`, { type: mimeType });
          console.log('Processing audio file:', audioFile.name, audioFile.type, audioFile.size);
          await processAudio(audioFile);
        } catch (error) {
          console.error('Error in onstop handler:', error);
          if (onProcessingStop) {
            onProcessingStop();
          }
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMessage = 'Could not access microphone. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Microphone is being used by another application.';
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error'}`;
      }
      
      alert(errorMessage);
    }
  };

  const pauseRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || !isRecording) return;
    try {
      if (mr.state === 'recording' && typeof mr.pause === 'function') {
        mr.pause();
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (e) {
      console.warn('Pause not supported', e);
    }
  };

  const resumeRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || !isRecording) return;
    try {
      if (mr.state === 'paused' && typeof mr.resume === 'function') {
        mr.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      }
    } catch (e) {
      console.warn('Resume not supported', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const mr = mediaRecorderRef.current;
      if (mr.state === 'paused' && typeof mr.resume === 'function') {
        mr.resume();
      }
      mr.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await processAudio(file);
    }
  };

  const processAudio = async (audioFile) => {
    // Validate file
    if (!audioFile || audioFile.size === 0) {
      alert('No audio data recorded. Please try again.');
      return;
    }

    console.log('Starting to process audio...', audioFile.name, audioFile.size, audioFile.type);
    
    // Set processing state immediately
    onProcessingStart();
    
    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('noteMode', noteMode);

      console.log('Sending audio to server...');
      const response = await api.post('/api/transcribe/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Received response from server');
      onNotesGenerated(response.data);
    } catch (error) {
      console.error('Error processing audio:', error);
      let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to process audio. Please check your API key and try again.';
      // Ensure we always show a string (API sometimes returns an object)
      if (typeof errorMessage === 'object' && errorMessage !== null) {
        errorMessage = errorMessage.message || JSON.stringify(errorMessage);
      }
      alert(String(errorMessage));
      if (onProcessingStop) {
        onProcessingStop(); // Reset processing state
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder">
      <h2 className="section-title">
        Audio Input
      </h2>
      
      <div className="recorder-container">
        <div className="recorder-controls">
          {!isRecording ? (
            <button
              className="record-button start"
              onClick={startRecording}
              disabled={isProcessing}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              Start Recording
            </button>
          ) : (
            <div className="recording-buttons">
              <button
                type="button"
                className="record-button pause"
                onClick={isPaused ? resumeRecording : pauseRecording}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    Pause
                  </>
                )}
              </button>
              <button
                className="record-button stop"
                onClick={stopRecording}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Stop Recording
              </button>
            </div>
          )}

          {isRecording && (
            <div className={`recording-indicator ${isPaused ? 'paused' : ''}`}>
              <span className="pulse-dot"></span>
              <span className="recording-text">
                {isPaused ? `Paused: ${formatTime(recordingTime)}` : `Recording: ${formatTime(recordingTime)}`}
              </span>
            </div>
          )}
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Audio File
          </button>
          <p className="upload-hint" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Supports MP3, WAV, M4A, and other audio formats</p>
          <p className="upload-hint" style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'Cormorant Garamond, serif' }}>
            For video calls (Zoom, Google Meet), record the meeting separately and upload the audio file here. Browser recording only captures your microphone, not meeting audio.
          </p>
        </div>

        {isProcessing && (
          <div className="processing-overlay">
            <div className="spinner"></div>
            <p>Processing audio and generating notes...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioRecorder;
