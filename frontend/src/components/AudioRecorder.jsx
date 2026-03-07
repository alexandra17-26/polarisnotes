import React, { useState, useRef, useEffect } from 'react';
import api from '../api';
import './AudioRecorder.css';

function AudioRecorder({ noteMode, onNotesGenerated, onProcessingStart, onProcessingStop, isProcessing }) {
  const RECOVERY_KEY = 'polaris_live_transcript_backup';

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecovery, setHasRecovery] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const transcriptRef = useRef('');
  const chunkQueueRef = useRef([]);
  const isProcessingChunkRef = useRef(false);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // On mount, check if there is a previous unfinished recording we can recover
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(RECOVERY_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data && typeof data.transcript === 'string' && data.transcript.trim()) {
            transcriptRef.current = data.transcript;
            setHasRecovery(true);
          } else {
            window.localStorage.removeItem(RECOVERY_KEY);
          }
        }
      }
    } catch (e) {
      console.warn('Unable to read recovery transcript from storage', e);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const saveTranscriptBackup = () => {
    try {
      if (typeof window === 'undefined') return;
      const transcript = transcriptRef.current;
      if (!transcript || !transcript.trim()) return;
      const payload = {
        transcript,
        noteMode,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(RECOVERY_KEY, JSON.stringify(payload));
      setHasRecovery(true);
    } catch (e) {
      console.warn('Unable to save recovery transcript', e);
    }
  };

  const clearTranscriptBackup = () => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(RECOVERY_KEY);
    } catch (e) {
      console.warn('Unable to clear recovery transcript', e);
    } finally {
      setHasRecovery(false);
    }
  };

  const enqueueChunk = (blob) => {
    if (!blob || blob.size === 0) return;
    chunkQueueRef.current.push(blob);
    if (!isProcessingChunkRef.current) {
      void processNextChunk();
    }
  };

  const processNextChunk = async () => {
    if (chunkQueueRef.current.length === 0) {
      isProcessingChunkRef.current = false;
      return;
    }

    isProcessingChunkRef.current = true;
    const blob = chunkQueueRef.current.shift();

    try {
      const mimeType = blob.type || 'audio/webm';
      const extension = mimeType.includes('webm')
        ? 'webm'
        : mimeType.includes('mp4') || mimeType.includes('m4a')
        ? 'm4a'
        : mimeType.includes('ogg')
        ? 'oga'
        : mimeType.includes('wav')
        ? 'wav'
        : 'webm';

      const audioFile = new File([blob], `chunk-${Date.now()}.${extension}`, { type: mimeType });
      const formData = new FormData();
      formData.append('audio', audioFile);

      console.log('Sending chunk to server...', audioFile.name, audioFile.size, audioFile.type);
      const response = await api.post('/api/transcribe/chunk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const chunkTranscript = response.data?.transcription;
      if (chunkTranscript && typeof chunkTranscript === 'string') {
        if (transcriptRef.current) {
          transcriptRef.current += '\n\n' + chunkTranscript;
        } else {
          transcriptRef.current = chunkTranscript;
        }
        saveTranscriptBackup();
      }
    } catch (error) {
      console.error('Error transcribing audio chunk:', error);
      // For chunk errors we log but do not interrupt the entire recording session
    } finally {
      if (chunkQueueRef.current.length > 0) {
        await processNextChunk();
      } else {
        isProcessingChunkRef.current = false;
      }
    }
  };

  const waitForAllChunksToFinish = async () => {
    // Wait until all queued chunks have been sent and processed
    for (;;) {
      if (chunkQueueRef.current.length === 0 && !isProcessingChunkRef.current) {
        break;
      }
      // Small delay before checking again
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

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
      transcriptRef.current = '';
      chunkQueueRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          enqueueChunk(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          stream.getTracks().forEach(track => track.stop());
          console.log('Recording stopped, waiting for remaining chunks to finish...');
          await waitForAllChunksToFinish();
          console.log('All chunks processed, generating notes from transcript...');
          const fullTranscript = transcriptRef.current;
          transcriptRef.current = '';
          chunkQueueRef.current = [];
          clearTranscriptBackup();
          await generateNotesFromTranscript(fullTranscript);
        } catch (error) {
          console.error('Error in onstop handler:', error);
          if (onProcessingStop) {
            onProcessingStop();
          }
        }
      };
      
      // Use a timeslice so MediaRecorder emits smaller chunks over time.
      // This allows very long recordings without hitting single-file limits.
      mediaRecorder.start(60000); // 60s per chunk
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
      let errorMessage;

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.message ||
          'Failed to process audio. Please check your API key and try again.';
      } else {
        // Network or CORS error (no response from server)
        errorMessage =
          'Unable to reach the Polaris Notes server. This often happens if the backend hosting (Render/Railway/etc.) is asleep, offline, or the API URL is misconfigured. Please check that your backend is running and that the VITE_API_URL environment variable (if used) points to the correct backend URL.';
      }

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

  const generateNotesFromTranscript = async (fullTranscript) => {
    if (!fullTranscript || !fullTranscript.trim()) {
      alert('Recording finished, but no clear speech was detected to transcribe. Please try again.');
      if (onProcessingStop) {
        onProcessingStop();
      }
      return;
    }

    console.log('Generating notes from existing transcript, length:', fullTranscript.length);

    onProcessingStart();

    // Small delay to ensure state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const response = await api.post('/api/transcribe/from-text', {
        transcription: fullTranscript,
        noteMode,
        // When using "notes-only" mode we still send the transcript,
        // but ask the backend not to store or return it.
        hideTranscription: noteMode === 'notes-only',
      });

      console.log('Received response from server (from-text)');
      onNotesGenerated(response.data);
      clearTranscriptBackup();
    } catch (error) {
      console.error('Error generating notes from transcript:', error);
      let errorMessage;

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.message ||
          'Failed to generate notes from transcript. Please check your API key and try again.';
      } else {
        errorMessage =
          'Unable to reach the Polaris Notes server while generating notes. Please verify that your backend is running and reachable from the frontend.';
      }

      if (typeof errorMessage === 'object' && errorMessage !== null) {
        errorMessage = errorMessage.message || JSON.stringify(errorMessage);
      }
      alert(String(errorMessage));
    } finally {
      if (onProcessingStop) {
        onProcessingStop();
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
        {hasRecovery && !isRecording && (
          <div className="recovery-banner">
            <p>
              It looks like a previous recording did not finish. You can try to recover notes from it.
            </p>
            <div className="recovery-actions">
              <button
                className="record-button start"
                type="button"
                onClick={() => {
                  const backup = transcriptRef.current;
                  if (backup && backup.trim()) {
                    void generateNotesFromTranscript(backup);
                  } else {
                    clearTranscriptBackup();
                  }
                }}
                disabled={isProcessing}
              >
                Generate Notes from Last Recording
              </button>
              <button
                className="record-button stop"
                type="button"
                onClick={clearTranscriptBackup}
                disabled={isProcessing}
              >
                Discard
              </button>
            </div>
          </div>
        )}
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
