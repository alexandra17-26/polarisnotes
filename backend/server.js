import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { transcribeAudio, generateNotes, generateInsights } from './services/aiService.js';
import { notesDb } from './services/database.js';

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

// Upload audio file endpoint
app.post('/api/transcribe/upload', upload.single('audio'), async (req, res) => {
  try {
    console.log('Received audio upload request');
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { noteMode } = req.body;
    const filePath = req.file.path;
    const originalName = req.file.originalname || 'recording.webm';
    console.log('File uploaded:', originalName, 'Size:', req.file.size, 'bytes', 'MIME:', req.file.mimetype);
    
    // Ensure file has proper extension for OpenAI
    const supportedExtensions = ['.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm'];
    const hasValidExtension = supportedExtensions.some(ext => originalName.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension && !req.file.mimetype?.includes('audio')) {
      console.warn('File extension may not be recognized, but proceeding with upload');
    }

    // Transcribe audio
    console.log('Starting transcription...');
    const transcription = await transcribeAudio(filePath);
    console.log('Transcription completed');

    // Generate notes based on mode
    console.log('Generating notes...');
    let customPrompt = null;
    
    // Check if it's a custom mode
    if (noteMode && noteMode.startsWith('custom-')) {
      const customModeId = parseInt(noteMode.replace('custom-', ''));
      const customMode = notesDb.getCustomModeById(customModeId);
      if (customMode) {
        customPrompt = customMode.prompt;
      }
    }
    
    const notes = await generateNotes(transcription, noteMode || 'detailed', 3, customPrompt);
    console.log('Notes generated');

    // Clean up uploaded file
    await fs.remove(filePath);

    // Save note to database
    const noteId = notesDb.saveNote({
      notes,
      transcription,
      mode: noteMode || 'detailed'
    });

    // Generate insights in the background
    generateInsights(transcription, notes).then(insights => {
      if (insights) {
        notesDb.saveNoteInsights(noteId, insights);
      }
    }).catch(err => {
      console.error('Error generating insights:', err);
    });

    res.json({
      success: true,
      transcription,
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

// Live recording endpoint (receives audio chunks)
app.post('/api/transcribe/live', async (req, res) => {
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

// Get available note modes
app.get('/api/modes', async (req, res) => {
  try {
    const customModes = notesDb.getAllCustomModes();
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

// Notes API endpoints
app.post('/api/notes', (req, res) => {
  try {
    const noteId = notesDb.saveNote(req.body);
    res.json({ success: true, noteId, note: notesDb.getNoteById(noteId) });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save note', message: error.message });
  }
});

app.get('/api/notes', (req, res) => {
  try {
    const { limit = 50, offset = 0, category, search } = req.query;
    
    let notes;
    if (search) {
      notes = notesDb.searchNotes(search, parseInt(limit));
    } else if (category) {
      notes = notesDb.getNotesByCategory(category);
    } else {
      notes = notesDb.getAllNotes(parseInt(limit), parseInt(offset));
    }
    
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', message: error.message });
  }
});

app.get('/api/notes/:id', (req, res) => {
  try {
    const note = notesDb.getNoteById(parseInt(req.params.id));
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

app.put('/api/notes/:id', (req, res) => {
  try {
    notesDb.updateNote(parseInt(req.params.id), req.body);
    const note = notesDb.getNoteById(parseInt(req.params.id));
    res.json({ success: true, note });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note', message: error.message });
  }
});

app.delete('/api/notes/:id', (req, res) => {
  try {
    notesDb.deleteNote(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note', message: error.message });
  }
});

// Custom modes API endpoints
app.post('/api/custom-modes', (req, res) => {
  try {
    const modeId = notesDb.saveCustomMode(req.body);
    res.json({ success: true, modeId, mode: notesDb.getCustomModeById(modeId) });
  } catch (error) {
    console.error('Error saving custom mode:', error);
    res.status(500).json({ error: 'Failed to save custom mode', message: error.message });
  }
});

app.get('/api/custom-modes', (req, res) => {
  try {
    const modes = notesDb.getAllCustomModes();
    res.json({ success: true, modes });
  } catch (error) {
    console.error('Error fetching custom modes:', error);
    res.status(500).json({ error: 'Failed to fetch custom modes', message: error.message });
  }
});

app.delete('/api/custom-modes/:id', (req, res) => {
  try {
    notesDb.deleteCustomMode(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom mode:', error);
    res.status(500).json({ error: 'Failed to delete custom mode', message: error.message });
  }
});

// Export endpoints
app.get('/api/notes/:id/export/:format', (req, res) => {
  try {
    const note = notesDb.getNoteById(parseInt(req.params.id));
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

// Share note endpoint (creates a shareable link)
app.post('/api/notes/:id/share', (req, res) => {
  try {
    const note = notesDb.getNoteById(parseInt(req.params.id));
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

// Email note endpoint
app.post('/api/notes/:id/email', async (req, res) => {
  try {
    const note = notesDb.getNoteById(parseInt(req.params.id));
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
