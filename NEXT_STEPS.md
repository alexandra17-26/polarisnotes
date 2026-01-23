# Next Steps - Setting Up Polaris Notes

Great! Node.js is installed. Now let's set up the application.

## Step 1: Install Backend Dependencies

In Terminal, type these commands one by one (press Enter after each):

```bash
cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/backend"
```

Then:

```bash
npm install
```

Wait for it to finish (it will take 1-2 minutes). You'll see a lot of text scrolling. When it's done, you'll see your prompt again.

## Step 2: Install Frontend Dependencies

Open a NEW Terminal window (keep the first one open):
- Press `Cmd + T` in Terminal to open a new tab, OR
- Press `Cmd + Space`, type "Terminal", and open a new window

In the new Terminal window, type:

```bash
cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/frontend"
```

Then:

```bash
npm install
```

Wait for it to finish (another 1-2 minutes).

## Step 3: Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in (you may need to add payment info)
3. Click "Create new secret key"
4. Copy the key (it looks like: `sk-...`)
5. **Save it somewhere safe** - you'll need it in the next step

## Step 4: Create the .env File

1. Open Finder
2. Navigate to: `Desktop` → `Polaris Ideas Project` → `Notetaking AI Program` → `backend`
3. In the backend folder, create a new file:
   - Right-click in the folder
   - Choose "New Document" → "Text Document"
   - Name it exactly: `.env` (with the dot at the beginning)
   - If Finder won't let you create a file starting with a dot, use Terminal (see below)

**OR use Terminal to create it:**

In Terminal, type:
```bash
cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/backend"
nano .env
```

Then type:
```
PORT=3001
OPENAI_API_KEY=your-api-key-here
```

Replace `your-api-key-here` with the actual API key you copied.

To save:
- Press `Ctrl + O` (that's the letter O)
- Press Enter
- Press `Ctrl + X` to exit

## Step 5: Start the Servers

You need BOTH servers running at the same time:

**Terminal Window 1 (Backend):**
```bash
cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/backend"
npm start
```

You should see: "Server running on http://localhost:3001"
**Keep this window open!**

**Terminal Window 2 (Frontend):**
```bash
cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/frontend"
npm run dev
```

You should see: "Local: http://localhost:3000"

## Step 6: Open the Application

1. Open your web browser
2. Go to: http://localhost:3000
3. The application should load!

---

**Important:** Both Terminal windows must stay open while you're using the app!
