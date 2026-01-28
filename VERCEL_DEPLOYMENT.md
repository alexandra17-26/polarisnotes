# Vercel Deployment Guide

## ⚠️ Important Note About File Storage

Your backend uses **file system storage** (JSON files and uploads folder). Vercel's serverless functions are **stateless** and don't persist files between deployments. 

**Recommended Solution:** Deploy backend separately on **Render** (free, supports persistent storage) and frontend on Vercel.

**Alternative:** Use Vercel Blob Storage or migrate to a database (MongoDB Atlas, Supabase, etc.) - requires code changes.

---

## Option 1: Frontend on Vercel + Backend on Render (Recommended)

### Step 1: Deploy Backend to Render

1. **Go to [render.com](https://render.com)** and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `polaris-notes-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)

5. **Add Environment Variables:**
   - `PORT` = `3001` (or leave default)
   - `OPENAI_API_KEY` = `your-openai-api-key-here`
   - `NODE_ENV` = `production`

6. Click **"Create Web Service"**
7. Wait for deployment (takes 2-5 minutes)
8. **Copy your backend URL** (e.g., `https://polaris-notes-backend.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install`

5. **Add Environment Variables:**
   - `VITE_API_URL` = `https://your-backend-url.onrender.com` (from Step 1)

6. Click **"Deploy"**
7. Wait for deployment (takes 1-2 minutes)
8. Your app will be live at `https://your-project.vercel.app`

### Step 3: Update Frontend API Calls (if needed)

The frontend uses relative paths (`/api/...`). If backend is on a different domain, you'll need to update axios calls. But since we're using `VITE_API_URL`, let's create an axios instance:

Create `frontend/src/api.js`:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export default api;
```

Then update all `axios` imports to use `api` instead.

---

## Option 2: Both on Vercel (File Storage Issue)

If you want to try deploying both on Vercel:

### Step 1: Update Vercel Configuration

The `vercel.json` file is already created. You'll need to:

1. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Vercel will auto-detect the `vercel.json` config

2. **Add Environment Variables:**
   - `OPENAI_API_KEY` = `your-openai-api-key`
   - `PORT` = `3001` (optional)

3. **⚠️ File Storage Limitation:**
   - JSON files (`data/notes.json`, etc.) will reset on each deployment
   - Uploaded files won't persist
   - Consider using Vercel Blob Storage or migrating to a database

### Step 2: Fix File Storage (Choose One)

**Option A: Use Vercel Blob Storage**
- Install: `npm install @vercel/blob`
- Update `database.js` to use Blob Storage instead of filesystem

**Option B: Use MongoDB Atlas (Free Tier)**
- Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Get connection string
- Install: `npm install mongodb`
- Update `database.js` to use MongoDB

**Option C: Use Supabase (Free Tier)**
- Sign up at [supabase.com](https://supabase.com)
- Create a project
- Use Supabase database instead of JSON files

---

## Quick Start (Recommended: Render + Vercel)

1. **Deploy Backend to Render:**
   ```bash
   # Make sure backend/.env has your OPENAI_API_KEY
   # Then follow Render steps above
   ```

2. **Deploy Frontend to Vercel:**
   ```bash
   # Make sure to set VITE_API_URL environment variable
   # Then follow Vercel steps above
   ```

3. **Test:**
   - Visit your Vercel URL
   - Try recording/uploading audio
   - Check if notes are saved

---

## Troubleshooting

### Backend not connecting
- Check CORS settings in `backend/server.js`
- Verify `VITE_API_URL` is set correctly in Vercel
- Check Render logs for errors

### File uploads not working
- On Render: Check `uploads/` folder permissions
- On Vercel: File storage won't persist (use Blob Storage or database)

### Environment variables not loading
- Restart the service after adding env vars
- Check variable names match exactly (case-sensitive)

### Build fails
- Check Node.js version (Render/Vercel auto-detects)
- Ensure all dependencies are in `package.json`
- Check build logs for specific errors

---

## Next Steps After Deployment

1. **Set up custom domain** (optional):
   - Vercel: Project Settings → Domains
   - Render: Settings → Custom Domain

2. **Enable HTTPS** (automatic on both platforms)

3. **Set up monitoring:**
   - Vercel: Built-in analytics
   - Render: Built-in logs

4. **Consider database migration** for production:
   - MongoDB Atlas (recommended)
   - Supabase
   - PostgreSQL on Render

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Check deployment logs in both platforms
