import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { transcribeAudio, generateNotes, generateInsights } from './services/aiService.js';
import { notesDb } from './services/database.js';
import { registerUser, loginUser, authMiddleware, optionalAuthMiddleware, loginOrRegisterGoogleUser } from './services/auth.js';
import { verifyGoogleIdToken } from './services/googleAuth.js';

dotenv.config();

// Debug: Check if API key is loaded (don't show full key)
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey === 'your-api-key-here' || apiKey === 'your-openai-api-key-here') {
  console.error('⚠️  WARNING: OPENAI_API_KEY not found or not set in .env file!');
  console.error('Please check your .env file in the backend folder.');
} else {
  console.log('✅ API key loaded (starts with:', apiKey.substring(0, 7) + '...)');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth endpoints (no auth required)
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const identifier = body.identifier ?? body.email ?? body.phone ?? '';
    const password = body.password ?? '';
    const idOrEmailOrPhone = String(identifier).trim();
    const result = await loginUser({ identifier: idOrEmailOrPhone, password });
    if (!result.success) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Login failed. Received body keys:', Object.keys(body), 'identifier length:', idOrEmailOrPhone.length, 'password length:', password ? password.length : 0);
      }
      return res.status(401).json({ success: false, error: result.error });
    }
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Google sign-in endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken is required.' });
    }
    const googlePayload = await verifyGoogleIdToken(idToken);
    const result = await loginOrRegisterGoogleUser(googlePayload);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Google sign-in failed.' });
  }
});

// Test API key endpoint
app.get('/api/test-key', async (req, res) => {
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Try a simple API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 5
    });
    
    res.json({ 
      success: true, 
      message: 'API key is working!',
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('API key test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'API key test failed',
      message: error.message,
      details: error.response?.data || error.error || 'Unknown error'
    });
  }
});

// Upload audio file endpoint (works with or without auth)
app.post('/api/transcribe/upload', optionalAuthMiddleware, upload.single('audio'), async (req, res) => {
  try {
    console.log('Received audio upload request');
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { noteMode } = req.body;
    const userId = req.user?.id ?? null;
    const filePath = req.file.path;
    const originalName = req.file.originalname || 'recording.webm';
    console.log('File uploaded:', originalName, 'Size:', req.file.size, 'bytes', 'MIME:', req.file.mimetype);
    
    // Ensure file has proper extension for OpenAI
    const supportedExtensions = ['.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm'];
    const hasValidExtension = supportedExtensions.some(ext => originalName.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension && !req.file.mimetype?.includes('audio')) {
      console.warn('File extension may not be recognized, but proceeding with upload');
    }

    // Transcribe audio (skip if notes-only mode)
    let transcription = null;
    if (noteMode !== 'notes-only') {
      console.log('Starting transcription...');
      transcription = await transcribeAudio(filePath);
      console.log('Transcription completed');
    } else {
      console.log('Skipping transcription for notes-only mode');
    }

    // Generate notes based on mode
    console.log('Generating notes...');
    let customPrompt = null;
    
    // Check if it's a custom mode
    if (noteMode && noteMode.startsWith('custom-')) {
      const customModeId = parseInt(noteMode.replace('custom-', ''));
      const customMode = notesDb.getCustomModeById(customModeId, userId);
      if (customMode) {
        customPrompt = customMode.prompt;
      }
    }
    
    // For notes-only mode, we still need to transcribe but won't show it
    // We'll transcribe internally but mark it as hidden
    let transcriptionForNotes = transcription;
    if (noteMode === 'notes-only' && !transcription) {
      console.log('Transcribing for notes generation (hidden)...');
      transcriptionForNotes = await transcribeAudio(filePath);
    }
    
    const notes = await generateNotes(transcriptionForNotes || transcription, noteMode || 'detailed', 3, customPrompt);
    console.log('Notes generated');

    // Clean up uploaded file
    await fs.remove(filePath);

    // Save note to database (don't save transcript for notes-only mode)
    const noteId = notesDb.saveNote({
      userId,
      notes,
      transcription: noteMode === 'notes-only' ? null : transcription,
      mode: noteMode || 'detailed'
    });

    // Generate insights in the background (use transcription if available)
    const insightsSource = transcriptionForNotes || transcription;
    if (insightsSource) {
      generateInsights(insightsSource, notes).then(insights => {
        if (insights) {
          notesDb.saveNoteInsights(noteId, insights);
        }
      }).catch(err => {
        console.error('Error generating insights:', err);
      });
    }

    res.json({
      success: true,
      transcription: noteMode === 'notes-only' ? null : transcription,
      notes,
      mode: noteMode || 'detailed',
      noteId
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    let errorMessage = error.message || 'Unknown error';
    let userMessage = 'Failed to process audio. ';
    
    // Provide more specific error messages
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      userMessage += 'API key issue. Please check your OpenAI API key in the .env file and ensure it has credits.';
    } else if (errorMessage.includes('rate limit')) {
      userMessage += 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (errorMessage.includes('insufficient_quota')) {
      userMessage += 'Insufficient API credits. Please add credits to your OpenAI account.';
    } else {
      userMessage += errorMessage;
    }
    
    res.status(500).json({ 
      error: 'Failed to process audio', 
      message: userMessage,
      details: errorMessage
    });
  }
});

// Transcribe a smaller audio chunk (for long, continuous recordings) — works with or without auth
app.post('/api/transcribe/chunk', optionalAuthMiddleware, upload.single('audio'), async (req, res) => {
  try {
    console.log('Received audio chunk for transcription');
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const filePath = req.file.path;
    console.log('Chunk file uploaded:', req.file.originalname || filePath, 'Size:', req.file.size);

    const transcription = await transcribeAudio(filePath);

    await fs.remove(filePath);

    res.json({
      success: true,
      transcription
    });
  } catch (error) {
    console.error('Error transcribing chunk:', error);
    res.status(500).json({
      error: 'Failed to transcribe chunk',
      message: error.message || 'Unknown error while transcribing chunk'
    });
  }
});

// Generate notes from an existing transcript (used for long, chunked recordings) — works with or without auth
app.post('/api/transcribe/from-text', optionalAuthMiddleware, async (req, res) => {
  try {
    const { transcription, noteMode, hideTranscription } = req.body;
    const userId = req.user?.id ?? null;

    if (!transcription || !String(transcription).trim()) {
      return res.status(400).json({ error: 'Transcription text is required' });
    }

    console.log('Generating notes from existing transcription, mode:', noteMode);

    let customPrompt = null;

    if (noteMode && String(noteMode).startsWith('custom-')) {
      const customModeId = parseInt(String(noteMode).replace('custom-', ''));
      const customMode = notesDb.getCustomModeById(customModeId, userId);
      if (customMode) {
        customPrompt = customMode.prompt;
      }
    }

    const finalMode = noteMode || 'detailed';

    const notes = await generateNotes(transcription, finalMode, 3, customPrompt);

    // Save note, optionally hiding the stored transcription
    const noteId = notesDb.saveNote({
      userId,
      notes,
      transcription: hideTranscription || finalMode === 'notes-only' ? null : transcription,
      mode: finalMode
    });

    // Generate insights in the background
    generateInsights(transcription, notes).then(insights => {
      if (insights) {
        notesDb.saveNoteInsights(noteId, insights);
      }
    }).catch(err => {
      console.error('Error generating insights (from-text):', err);
    });

    res.json({
      success: true,
      transcription: hideTranscription || finalMode === 'notes-only' ? null : transcription,
      notes,
      mode: finalMode,
      noteId
    });
  } catch (error) {
    console.error('Error generating notes from text:', error);
    res.status(500).json({
      error: 'Failed to generate notes from text',
      message: error.message || 'Unknown error while generating notes from transcription'
    });
  }
});

// Live recording endpoint (receives audio chunks) — works with or without auth
app.post('/api/transcribe/live', optionalAuthMiddleware, async (req, res) => {
  try {
    const { audioData, noteMode, isFinal } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Convert base64 to buffer if needed
    const audioBuffer = Buffer.from(audioData, 'base64');
    const tempFilePath = join(uploadsDir, `live-${Date.now()}.webm`);
    
    await fs.writeFile(tempFilePath, audioBuffer);

    // Transcribe audio
    const transcription = await transcribeAudio(tempFilePath);

    // Generate notes if this is the final chunk
    let notes = null;
    if (isFinal) {
      notes = await generateNotes(transcription, noteMode || 'detailed');
    }

    // Clean up temp file
    await fs.remove(tempFilePath);

    res.json({
      success: true,
      transcription,
      notes: notes || null,
      isFinal: !!isFinal,
      mode: noteMode || 'detailed'
    });
  } catch (error) {
    console.error('Error processing live audio:', error);
    res.status(500).json({ 
      error: 'Failed to process live audio', 
      message: error.message 
    });
  }
});

// Get available note modes (works with or without auth; custom modes scoped to user when logged in)
app.get('/api/modes', optionalAuthMiddleware, async (req, res) => {
  try {
    const customModes = notesDb.getAllCustomModes(req.user?.id ?? null);
    const defaultModes = [
      {
        id: 'summary',
        name: 'Summary',
        description: 'Concise overview of key points'
      },
      {
        id: 'detailed',
        name: 'Detailed',
        description: 'Comprehensive notes with full context'
      },
      {
        id: 'bullet',
        name: 'Bullet Points',
        description: 'Organized bullet points for meetings'
      },
      {
        id: 'action-items',
        name: 'Action Items',
        description: 'Focus on tasks and action items'
      },
      {
        id: 'notes-only',
        name: 'Notes Only',
        description: 'Generate notes without transcript'
      },
      {
        id: 'transcript',
        name: 'Full Transcript',
        description: 'Complete verbatim transcription'
      }
    ];
    
    const customModesFormatted = customModes.map(mode => ({
      id: `custom-${mode.id}`,
      name: mode.name,
      description: mode.description || '',
      isCustom: true
    }));
    
    res.json({
      modes: [...defaultModes, ...customModesFormatted]
    });
  } catch (error) {
    console.error('Error fetching modes:', error);
    res.status(500).json({ error: 'Failed to fetch modes' });
  }
});

// Notes API endpoints (work with or without auth; scoped to user when logged in)
app.post('/api/notes', optionalAuthMiddleware, (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const noteId = notesDb.saveNote({ ...req.body, userId });
    res.json({ success: true, noteId, note: notesDb.getNoteById(noteId, userId) });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note', message: error.message });
  }
});

app.get('/api/notes', optionalAuthMiddleware, (req, res) => {
  try {
    const { limit = 50, offset = 0, category, search } = req.query;
    const userId = req.user?.id ?? null;
    let notes;
    if (search) {
      notes = notesDb.searchNotes(search, parseInt(limit), userId);
    } else if (category) {
      notes = notesDb.getNotesByCategory(category, userId);
    } else {
      notes = notesDb.getAllNotes(parseInt(limit), parseInt(offset), userId);
    }
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', message: error.message });
  }
});

app.get('/api/notes/:id', optionalAuthMiddleware, (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const note = notesDb.getNoteById(parseInt(req.params.id), userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const insights = notesDb.getNoteInsights(note.id);
    res.json({ success: true, note, insights });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note', message: error.message });
  }
});

app.put('/api/notes/:id', optionalAuthMiddleware, (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const updated = notesDb.updateNote(parseInt(req.params.id), req.body, userId);
    if (!updated) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true, note: notesDb.getNoteById(parseInt(req.params.id), userId) });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note', message: error.message });
  }
});

app.delete('/api/notes/:id', optionalAuthMiddleware, (req, res) => {
  try {
    notesDb.deleteNote(parseInt(req.params.id), req.user?.id ?? null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note', message: error.message });
  }
});

// Note comments endpoints (work with or without auth)
app.post('/api/notes/:id/comments', optionalAuthMiddleware, (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user?.id ?? null;
    const note = notesDb.getNoteById(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { text, highlightedText } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comments = Array.isArray(note.comments) ? note.comments : [];
    const newComment = {
      id: Date.now(),
      text: text.trim(),
      highlightedText: (highlightedText || '').trim(),
      created_at: new Date().toISOString()
    };

    const updatedComments = [...comments, newComment];
    notesDb.updateNote(noteId, { comments: updatedComments });

    res.json({ success: true, comments: updatedComments });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment', message: error.message });
  }
});

app.delete('/api/notes/:id/comments/:commentId', optionalAuthMiddleware, (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);
    const userId = req.user?.id ?? null;
    const note = notesDb.getNoteById(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const comments = Array.isArray(note.comments) ? note.comments : [];
    const updatedComments = comments.filter(c => c.id !== commentId);

    notesDb.updateNote(noteId, { comments: updatedComments });

    res.json({ success: true, comments: updatedComments });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment', message: error.message });
  }
});

// Custom modes API endpoints (work with or without auth; scoped to user when logged in)
app.post('/api/custom-modes', optionalAuthMiddleware, (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const modeId = notesDb.saveCustomMode({ ...req.body, userId });
    res.json({ success: true, modeId, mode: notesDb.getCustomModeById(modeId, userId) });
  } catch (error) {
    console.error('Error saving custom mode:', error);
    res.status(500).json({ error: 'Failed to save custom mode', message: error.message });
  }
});

app.get('/api/custom-modes', optionalAuthMiddleware, (req, res) => {
  try {
    const modes = notesDb.getAllCustomModes(req.user?.id ?? null);
    res.json({ success: true, modes });
  } catch (error) {
    console.error('Error fetching custom modes:', error);
    res.status(500).json({ error: 'Failed to fetch custom modes', message: error.message });
  }
});

app.delete('/api/custom-modes/:id', optionalAuthMiddleware, (req, res) => {
  try {
    notesDb.deleteCustomMode(parseInt(req.params.id), req.user?.id ?? null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom mode:', error);
    res.status(500).json({ error: 'Failed to delete custom mode', message: error.message });
  }
});

// Export endpoints (work with or without auth)
app.get('/api/notes/:id/export/:format', optionalAuthMiddleware, (req, res) => {
  try {
    const note = notesDb.getNoteById(parseInt(req.params.id), req.user?.id ?? null);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const { format } = req.params;
    
    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="note-${note.id}.md"`);
      res.send(`# ${note.title || 'Note'}\n\n${note.notes}`);
    } else if (format === 'txt') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="note-${note.id}.txt"`);
      res.send(note.notes);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Error exporting note:', error);
    res.status(500).json({ error: 'Failed to export note', message: error.message });
  }
});

// Share note endpoint (creates a shareable link) — works with or without auth
app.post('/api/notes/:id/share', optionalAuthMiddleware, (req, res) => {
  try {
    const note = notesDb.getNoteById(parseInt(req.params.id), req.user?.id ?? null);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // For now, return the note data that can be shared
    // In production, you'd create a unique share token
    const shareData = {
      id: note.id,
      title: note.title || `Note ${note.id}`,
      notes: note.notes,
      mode: note.mode,
      createdAt: note.created_at
    };
    
    res.json({ 
      success: true, 
      shareUrl: `${req.protocol}://${req.get('host')}/share/${note.id}`,
      shareData 
    });
  } catch (error) {
    console.error('Error sharing note:', error);
    res.status(500).json({ error: 'Failed to share note', message: error.message });
  }
});

// Email note endpoint — works with or without auth
app.post('/api/notes/:id/email', optionalAuthMiddleware, async (req, res) => {
  try {
    const note = notesDb.getNoteById(parseInt(req.params.id), req.user?.id ?? null);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    
    // Create mailto link with proper encoding
    // The email address goes in the mailto: part, not in the body
    const subject = encodeURIComponent(`Notes: ${note.title || `Note ${note.id}`}`);
    const body = encodeURIComponent(`Here are your notes from Polaris Notes:\n\n${note.notes}\n\n---\nGenerated by Polaris Notes`);
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
    
    // Return the mailto link - the frontend can open it
    res.json({ 
      success: true, 
      mailtoLink,
      message: 'Email link generated. Your email client will open.'
    });
  } catch (error) {
    console.error('Error preparing email:', error);
    res.status(500).json({ error: 'Failed to prepare email', message: error.message });
  }
});

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless functions
export default app;
