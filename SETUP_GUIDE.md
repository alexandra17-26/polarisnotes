# Step-by-Step Setup Guide for Polaris Notes

## Step 1: Install Node.js (If You Don't Have It)

1. **Check if Node.js is installed:**
   - Open Terminal (Press `Cmd + Space`, type "Terminal", press Enter)
   - Type: `node --version` and press Enter
   - If you see a version number (like v18.0.0), skip to Step 2
   - If you see "command not found", continue below

2. **Install Node.js:**
   - Go to: https://nodejs.org/
   - Download the "LTS" version (recommended)
   - Run the installer and follow the instructions
   - Restart your Terminal after installation

## Step 2: Get Your OpenAI API Key

1. Go to: https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key (you'll need it in Step 4)

## Step 3: Install Backend Dependencies

1. Open Terminal
2. Navigate to the backend folder:
   ```bash
   cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/backend"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
   (This will take 1-2 minutes)

## Step 4: Create Environment File

1. In the backend folder, create a file named `.env`
2. Open it in a text editor and add:
   ```
   PORT=3001
   OPENAI_API_KEY=paste-your-api-key-here
   ```
3. Replace `paste-your-api-key-here` with the API key you copied in Step 2
4. Save the file

## Step 5: Install Frontend Dependencies

1. Open a NEW Terminal window (keep the first one open)
2. Navigate to the frontend folder:
   ```bash
   cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/frontend"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
   (This will take 1-2 minutes)

## Step 6: Start the Backend Server

1. In the first Terminal window (backend folder), type:
   ```bash
   npm start
   ```
2. You should see: "Server running on http://localhost:3001"
3. **Keep this window open** - don't close it!

## Step 7: Start the Frontend Server

1. In the second Terminal window (frontend folder), type:
   ```bash
   npm run dev
   ```
2. You should see something like: "Local: http://localhost:3000"
3. **Keep this window open too!**

## Step 8: Open the Application

1. Open your web browser (Chrome, Safari, Firefox, etc.)
2. Go to: http://localhost:3000
3. The application should now be running!

## Troubleshooting

### "Command not found: node" or "Command not found: npm"
- Node.js is not installed. Go back to Step 1.

### "Cannot find module" errors
- Make sure you ran `npm install` in both backend and frontend folders
- Make sure you're in the correct folder when running commands

### "Port already in use" error
- Another program is using port 3000 or 3001
- Close other applications or restart your computer

### "Failed to process audio" error
- Check that your OpenAI API key is correct in the `.env` file
- Make sure you have credits in your OpenAI account

### The page won't load
- Make sure BOTH servers are running (backend and frontend)
- Check that you're going to http://localhost:3000 (not 3001)
- Try refreshing the page

## Need Help?

- Make sure both Terminal windows are open and running
- Check that you see "Server running" messages in both
- The backend must be running before the frontend will work
