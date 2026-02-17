# 🚀 Production Deployment Guide - Step by Step

## Step 1: Push Code to GitHub

**You need to push manually because authentication is required:**

1. Open Terminal (or use Cursor's terminal)
2. Run these commands:
   ```bash
   cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program"
   git push origin main
   ```
3. When prompted:
   - **Username:** Enter your GitHub username
   - **Password:** Enter a GitHub Personal Access Token (NOT your GitHub password)
     - Get token here: https://github.com/settings/tokens/new
     - Check "repo" scope
     - Copy the token and paste it as the password

---

## Step 2: Deploy Backend to Render.com

### 2.1 Sign Up / Log In
1. Go to: https://render.com
2. Sign up with GitHub (easiest way - connects automatically)

### 2.2 Create Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**

### 2.3 Connect Repository
1. Click **"Connect account"** if needed
2. Select your repository: `alexandra17-26/polarisnotes` (or whatever yours is called)
3. Click **"Connect"**

### 2.4 Configure Backend Service
Fill in these settings:

- **Name:** `polaris-notes-backend` (or any name you like)
- **Root Directory:** `backend` ⚠️ **IMPORTANT!**
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** `Free` (or choose paid if you want)

### 2.5 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add:

1. **Variable:** `OPENAI_API_KEY`
   **Value:** `your-actual-openai-api-key-here`
   (Get this from: https://platform.openai.com/api-keys)

2. **Variable:** `PORT`
   **Value:** `3001`
   (Optional - Render sets this automatically)

3. **Variable:** `NODE_ENV`
   **Value:** `production`

### 2.6 Deploy
1. Click **"Create Web Service"** (green button)
2. Wait 2-5 minutes for deployment
3. Watch the logs - you should see "Server running on port..."
4. **Copy your backend URL** - looks like: `https://polaris-notes-backend.onrender.com`
   - ⚠️ **SAVE THIS URL** - you'll need it for the frontend!

---

## Step 3: Deploy Frontend to Vercel.com

### 3.1 Sign Up / Log In
1. Go to: https://vercel.com
2. Sign up with GitHub (easiest way)

### 3.2 Create New Project
1. Click **"Add New..."** button
2. Select **"Project"**

### 3.3 Import Repository
1. Find your repository: `alexandra17-26/polarisnotes`
2. Click **"Import"**

### 3.4 Configure Frontend
Vercel should auto-detect settings, but verify:

- **Framework Preset:** `Vite` (should auto-detect)
- **Root Directory:** `frontend` ⚠️ **IMPORTANT!**
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `dist` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

### 3.5 Add Environment Variable
**This is CRITICAL - don't skip this!**

1. Click **"Environment Variables"** section
2. Click **"Add"** or **"Add New"**
3. Add this variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.onrender.com`
     - Replace `your-backend-url` with the actual URL from Step 2.6
     - Example: `https://polaris-notes-backend.onrender.com`
   - **Environment:** Check all boxes (Production, Preview, Development)

### 3.6 Deploy
1. Click **"Deploy"** button
2. Wait 1-2 minutes
3. Your app will be live! 🎉
4. **Copy your frontend URL** - looks like: `https://polaris-notes-xyz123.vercel.app`

---

## Step 4: Connect Custom Domain to Vercel

### 4.1 Add Domain in Vercel
1. Go to your Vercel project dashboard
2. Click **"Settings"** tab
3. Click **"Domains"** in the left sidebar
4. Enter your domain name (e.g., `polarisnotes.com` or `www.polarisnotes.com`)
5. Click **"Add"**

### 4.2 Configure DNS Records
Vercel will show you what DNS records to add. You need to add these at your domain registrar (where you bought the domain - GoDaddy, Namecheap, etc.):

**Option A: Root Domain (e.g., polarisnotes.com)**
- **Type:** `A`
- **Name:** `@` (or leave blank)
- **Value:** `76.76.21.21` (Vercel's IP - they'll show you the exact IP)

**Option B: WWW Subdomain (e.g., www.polarisnotes.com)**
- **Type:** `CNAME`
- **Name:** `www`
- **Value:** `cname.vercel-dns.com` (Vercel will show you the exact value)

**Option C: Both (Recommended)**
- Add both A record (for root) and CNAME record (for www)

### 4.3 Wait for DNS Propagation
- DNS changes can take 5 minutes to 48 hours
- Usually takes 10-30 minutes
- Vercel will show "Valid Configuration" when it's ready

### 4.4 SSL Certificate
- Vercel automatically provides SSL certificates (HTTPS)
- This happens automatically after DNS is configured
- No action needed from you!

---

## Step 5: Verify Everything Works

### 5.1 Test Frontend
1. Visit your Vercel URL (or custom domain)
2. The app should load

### 5.2 Test Recording
1. Click "Start Recording"
2. Speak something
3. Stop recording
4. Verify notes are generated

### 5.3 Test File Upload
1. Click "Upload Audio File"
2. Select an audio file
3. Verify it processes and generates notes

### 5.4 Test Note History
1. Create a few notes
2. Check "Note History" section
3. Verify notes are saved and searchable

### 5.5 Check Backend Logs
1. Go to Render dashboard
2. Click on your backend service
3. Click "Logs" tab
4. Verify no errors

---

## Troubleshooting

### Frontend can't connect to backend
- ✅ Check `VITE_API_URL` is set correctly in Vercel
- ✅ Make sure backend URL has no trailing slash
- ✅ Check browser console for errors (F12 → Console)
- ✅ Verify backend is running (check Render logs)

### Backend errors
- ✅ Check `OPENAI_API_KEY` is set correctly in Render
- ✅ Check Render logs for specific error messages
- ✅ Verify backend service is running (not sleeping)

### Domain not working
- ✅ Check DNS records are correct at your registrar
- ✅ Wait for DNS propagation (can take up to 48 hours)
- ✅ Verify domain is added in Vercel settings
- ✅ Check Vercel shows "Valid Configuration"

### Notes not saving
- ✅ Check Render logs for file system errors
- ✅ Verify `backend/data/` folder exists (Render creates it automatically)
- ✅ Check file permissions in Render logs

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render
- [ ] Backend URL copied
- [ ] `OPENAI_API_KEY` set in Render
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set in Vercel (pointing to Render backend)
- [ ] Custom domain added to Vercel
- [ ] DNS records configured at domain registrar
- [ ] Tested recording audio
- [ ] Tested uploading file
- [ ] Tested saving notes
- [ ] Verified custom domain works

---

## Important URLs to Save

**Backend URL:** `https://____________________.onrender.com`  
**Frontend URL:** `https://____________________.vercel.app`  
**Custom Domain:** `https://____________________.com`

---

## Need Help?

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Check logs:** Both platforms have built-in log viewers
- **Browser console:** Press F12 to see frontend errors

---

**You've got this! Follow each step carefully and you'll have your app live in production! 🚀**
