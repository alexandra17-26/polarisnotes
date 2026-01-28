import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
const notesFile = join(dataDir, 'notes.json');
const customModesFile = join(dataDir, 'custom-modes.json');
const insightsFile = join(dataDir, 'insights.json');

// Ensure data directory exists
fs.ensureDirSync(dataDir);

// Initialize files if they don't exist
if (!fs.existsSync(notesFile)) {
  fs.writeJsonSync(notesFile, []);
}
if (!fs.existsSync(customModesFile)) {
  fs.writeJsonSync(customModesFile, []);
}
if (!fs.existsSync(insightsFile)) {
  fs.writeJsonSync(insightsFile, []);
}

// Helper functions
const readNotes = () => {
  try {
    return fs.readJsonSync(notesFile);
  } catch {
    return [];
  }
};

const writeNotes = (notes) => {
  fs.writeJsonSync(notesFile, notes, { spaces: 2 });
};

const readCustomModes = () => {
  try {
    return fs.readJsonSync(customModesFile);
  } catch {
    return [];
  }
};

const writeCustomModes = (modes) => {
  fs.writeJsonSync(customModesFile, modes, { spaces: 2 });
};

const readInsights = () => {
  try {
    return fs.readJsonSync(insightsFile);
  } catch {
    return [];
  }
};

const writeInsights = (insights) => {
  fs.writeJsonSync(insightsFile, insights, { spaces: 2 });
};

export const notesDb = {
  // Save a new note
  saveNote: (noteData) => {
    const notes = readNotes();
    const newNote = {
      id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
      title: noteData.title || `Note ${new Date().toLocaleString()}`,
      notes: noteData.notes,
      transcription: noteData.transcription || null,
      mode: noteData.mode,
      tags: noteData.tags || [],
      category: noteData.category || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    notes.push(newNote);
    writeNotes(notes);
    return newNote.id;
  },

  // Get all notes
  getAllNotes: (limit = 50, offset = 0) => {
    const notes = readNotes();
    return notes
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit);
  },

  // Get note by ID
  getNoteById: (id) => {
    const notes = readNotes();
    return notes.find(note => note.id === id) || null;
  },

  // Update note
  updateNote: (id, updates) => {
    const notes = readNotes();
    const index = notes.findIndex(note => note.id === id);
    if (index === -1) return null;
    
    notes[index] = {
      ...notes[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    writeNotes(notes);
    return notes[index];
  },

  // Delete note
  deleteNote: (id) => {
    const notes = readNotes();
    const filtered = notes.filter(note => note.id !== id);
    writeNotes(filtered);
    
    // Also delete associated insights
    const insights = readInsights();
    const filteredInsights = insights.filter(insight => insight.note_id !== id);
    writeInsights(filteredInsights);
  },

  // Search notes
  searchNotes: (query, limit = 50) => {
    const notes = readNotes();
    const searchTerm = query.toLowerCase();
    return notes
      .filter(note => 
        note.notes?.toLowerCase().includes(searchTerm) ||
        note.transcription?.toLowerCase().includes(searchTerm) ||
        note.title?.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  // Get notes by category
  getNotesByCategory: (category) => {
    const notes = readNotes();
    return notes
      .filter(note => note.category === category)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Custom modes
  saveCustomMode: (modeData) => {
    const modes = readCustomModes();
    const newMode = {
      id: modes.length > 0 ? Math.max(...modes.map(m => m.id)) + 1 : 1,
      name: modeData.name,
      description: modeData.description || null,
      prompt: modeData.prompt,
      writing_style: modeData.writing_style || null,
      created_at: new Date().toISOString()
    };
    modes.push(newMode);
    writeCustomModes(modes);
    return newMode.id;
  },

  getAllCustomModes: () => {
    return readCustomModes();
  },

  getCustomModeById: (id) => {
    const modes = readCustomModes();
    return modes.find(mode => mode.id === id) || null;
  },

  deleteCustomMode: (id) => {
    const modes = readCustomModes();
    const filtered = modes.filter(mode => mode.id !== id);
    writeCustomModes(filtered);
  },

  // Note insights
  saveNoteInsights: (noteId, insights) => {
    const allInsights = readInsights();
    const existingIndex = allInsights.findIndex(i => i.note_id === noteId);
    
    const insightData = {
      note_id: noteId,
      topics: insights.topics || [],
      action_items: insights.action_items || [],
      dates: insights.dates || [],
      key_points: insights.key_points || []
    };
    
    if (existingIndex !== -1) {
      allInsights[existingIndex] = insightData;
    } else {
      allInsights.push(insightData);
    }
    
    writeInsights(allInsights);
  },

  getNoteInsights: (noteId) => {
    const insights = readInsights();
    return insights.find(i => i.note_id === noteId) || null;
  }
};

export default notesDb;
