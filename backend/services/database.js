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

// Filter notes by userId (null/undefined userId means legacy note, allowed for backward compat)
const matchUser = (note, userId) => {
  if (userId == null) return true;
  return (note.user_id ?? note.userId) === userId;
};

export const notesDb = {
  // Save a new note (userId required for per-user notes)
  saveNote: (noteData) => {
    const notes = readNotes();
    const newNote = {
      id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
      user_id: noteData.userId ?? noteData.user_id ?? null,
      title: noteData.title || `Note ${new Date().toLocaleString()}`,
      notes: noteData.notes,
      transcription: noteData.transcription || null,
      mode: noteData.mode,
      tags: noteData.tags || [],
      category: noteData.category || null,
      comments: noteData.comments || [],
      highlights: noteData.highlights || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    notes.push(newNote);
    writeNotes(notes);
    return newNote.id;
  },

  // Get all notes (optional userId to scope to user)
  getAllNotes: (limit = 50, offset = 0, userId = null) => {
    const notes = readNotes();
    const filtered = userId != null ? notes.filter(n => matchUser(n, userId)) : notes;
    return filtered
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit);
  },

  // Get note by ID (optional userId to ensure ownership)
  getNoteById: (id, userId = null) => {
    const notes = readNotes();
    const note = notes.find(note => note.id === id) || null;
    if (!note) return null;
    if (userId != null && !matchUser(note, userId)) return null;
    return note;
  },

  // Update note (userId optional for ownership check)
  updateNote: (id, updates, userId = null) => {
    const notes = readNotes();
    const index = notes.findIndex(note => note.id === id);
    if (index === -1) return null;
    if (userId != null && !matchUser(notes[index], userId)) return null;
    notes[index] = {
      ...notes[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    writeNotes(notes);
    return notes[index];
  },

  // Delete note (userId optional for ownership check)
  deleteNote: (id, userId = null) => {
    const notes = readNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    if (userId != null && !matchUser(note, userId)) return;
    const filtered = notes.filter(note => note.id !== id);
    writeNotes(filtered);
    const insights = readInsights();
    const filteredInsights = insights.filter(insight => insight.note_id !== id);
    writeInsights(filteredInsights);
  },

  // Search notes (optional userId)
  searchNotes: (query, limit = 50, userId = null) => {
    const notes = readNotes();
    const byUser = userId != null ? notes.filter(n => matchUser(n, userId)) : notes;
    const insights = readInsights();
    const searchTerm = query.toLowerCase();

    const getInsightsText = (noteId) => {
      const insight = insights.find(i => i.note_id === noteId);
      if (!insight) return '';

      const topics = Array.isArray(insight.topics) ? insight.topics.join(' ') : '';
      const dates = Array.isArray(insight.dates) ? insight.dates.join(' ') : '';
      const keyPoints = Array.isArray(insight.key_points) ? insight.key_points.join(' ') : '';

      const actionItems = Array.isArray(insight.action_items)
        ? insight.action_items.map(item => {
            if (typeof item === 'string') return item;
            return `${item.task || ''} ${item.assignee || ''} ${item.deadline || ''}`;
          }).join(' ')
        : '';

      return `${topics} ${dates} ${keyPoints} ${actionItems}`.toLowerCase();
    };

    return byUser
      .filter(note => {
        const baseText = [
          note.title || '',
          note.notes || '',
          note.transcription || '',
          Array.isArray(note.tags) ? note.tags.join(' ') : '',
          note.category || ''
        ].join(' ').toLowerCase();
        const insightsText = getInsightsText(note.id);
        return baseText.includes(searchTerm) || insightsText.includes(searchTerm);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  // Get notes by category (optional userId)
  getNotesByCategory: (category, userId = null) => {
    const notes = readNotes();
    const filtered = userId != null ? notes.filter(n => matchUser(n, userId)) : notes;
    return filtered
      .filter(note => note.category === category)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Custom modes (optional user_id for per-user modes)
  saveCustomMode: (modeData) => {
    const modes = readCustomModes();
    const newMode = {
      id: modes.length > 0 ? Math.max(...modes.map(m => m.id)) + 1 : 1,
      user_id: modeData.userId ?? modeData.user_id ?? null,
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

  getAllCustomModes: (userId = null) => {
    const modes = readCustomModes();
    if (userId == null) return modes;
    return modes.filter(m => (m.user_id ?? m.userId) === userId);
  },

  getCustomModeById: (id, userId = null) => {
    const modes = readCustomModes();
    const mode = modes.find(m => m.id === id) || null;
    if (!mode) return null;
    if (userId != null && (mode.user_id ?? mode.userId) !== userId) return null;
    return mode;
  },

  deleteCustomMode: (id, userId = null) => {
    const modes = readCustomModes();
    const mode = modes.find(m => m.id === id);
    if (!mode) return;
    if (userId != null && (mode.user_id ?? mode.userId) !== userId) return;
    const filtered = modes.filter(m => m.id !== id);
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
