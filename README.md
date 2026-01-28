# Polaris Notes - AI Note-Taking Application

A futuristic, techy AI-powered note-taking web application that can record notes from audio (live recording or file upload) with multiple note-taking modes.

## Features

- 🎤 **Live Audio Recording** - Record audio directly in the browser
- 📁 **Audio File Upload** - Upload audio files (MP3, WAV, M4A, etc.)
- 🤖 **AI-Powered Transcription** - Uses OpenAI Whisper for accurate transcription
- 📝 **Multiple Note Modes**:
  - **Summary** - Concise overview of key points
  - **Detailed** - Comprehensive notes with full context
  - **Bullet Points** - Organized bullet points for meetings
  - **Action Items** - Focus on tasks and action items
  - **Full Transcript** - Complete verbatim transcription
  - **Custom Modes** - Create and upload your own note templates and writing styles
- 💾 **Note History & Saving** - All notes are automatically saved to a local database
- ✏️ **Edit & Refine** - Edit generated notes and save changes
- 📤 **Export Options** - Export as Markdown, TXT, or copy to clipboard
- 🔍 **Search & Filter** - Search through saved notes and filter by category
- 💡 **Note Insights** - Automatically extract topics, action items, and important dates
- 🔗 **Sharing** - Share notes via link
- 🎨 **Elegant UI** - Clean, minimal design with serif typography

## Tech Stack

### Backend
- Node.js with Express
- OpenAI API (Whisper for transcription, GPT-4 for note generation)
- Multer for file uploads
- CORS enabled

### Frontend
- React with Vite
- Modern CSS with custom properties
- Responsive design

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=3001
OPENAI_API_KEY=your-openai-api-key-here
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Select a note-taking mode from the available options
2. Either:
   - Click "Start Recording" to record live audio
   - Click "Upload Audio File" to upload an existing audio file
3. Wait for processing (transcription and note generation)
4. View your notes in the right panel
5. Switch between "Generated Notes" and "Full Transcript" tabs
6. Copy or download your notes as needed

## Project Structure

```
Notetaking AI Program/
├── backend/
│   ├── server.js              # Express server
│   ├── services/
│   │   └── aiService.js       # OpenAI integration
│   ├── uploads/               # Temporary audio storage
│   ├── package.json
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/modes` - Get available note-taking modes
- `POST /api/transcribe/upload` - Upload and process audio file
- `POST /api/transcribe/live` - Process live audio chunks

## Notes

- Make sure to set your OpenAI API key in the backend `.env` file
- Audio files are temporarily stored during processing and then deleted
- The application supports various audio formats (MP3, WAV, M4A, WebM, etc.)
- For live recording, the browser will request microphone permissions

## License

MIT
