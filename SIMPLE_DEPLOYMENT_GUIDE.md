# 🚀 Simple Deployment Guide - Polaris Notes

## What Stack Is This?

**Your app uses:**
- **Frontend:** React (with Vite) - This is the website users see
- **Backend:** Node.js + Express - This handles the AI processing
- **AI:** OpenAI (Whisper for transcription, GPT-4 for notes)
- **Storage:** JSON files (stored on the server)

---

## Easiest Way to Deploy (Recommended)

**Use these two FREE services:**
1. **Render.com** - For your backend (handles AI processing)
2. **Vercel.com** - For your frontend (the website)

**Why these?**
- Both are FREE to start
- Both are super easy to set up (no coding required)
- Render supports file storage (your app needs this)
- Vercel is the standard for React apps
- Both automatically handle HTTPS/SSL certificates

---

## Step-by-Step Instructions

### PART 1: Push Your Code to GitHub (If Not Already Done)

1. Open Terminal (or use Cursor's built-in terminal)
2. Run these commands:
   ```bash
   cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program"
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```
3. If asked for credentials:
   - Username: Your GitHub username
   - Password: Use a GitHub Personal Access Token (NOT your password)
     - Get one here: https://github.com/settings/tokens/new
     - Check "repo" scope
     - Copy the token and use it as password

---

### PART 2: Deploy Backend to Render.com

#### Step 1: Sign Up
1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest - it connects automatically)

#### Step 2: Create Web Service
1. Click the big **"New +"** button (top right)
2. Click **"Web Service"**

#### Step 3: Connect Your Code
1. Find your repository in the list (should be `alexandra17-26/polarisnotes` or similar)
2. Click **"Connect"**

#### Step 4: Configure Settings
Fill in exactly like this:

- **Name:** `polaris-notes-backend` (or any name you like)
- **Root Directory:** `backend` ⚠️ **VERY IMPORTANT!**
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** `Free` (you can upgrade later)

#### Step 5: Add Your OpenAI API Key
1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add these THREE variables:

   **Variable 1:**
   - **Key:** `OPENAI_API_KEY`
   - **Value:** `your-actual-openai-api-key-here`
     - Get this from: https://platform.openai.com/api-keys
     - Copy the entire key and paste it here

   **Variable 2:**
   - **Key:** `PORT`
   - **Value:** `3001`

   **Variable 3:**
   - **Key:** `NODE_ENV`
   - **Value:** `production`

#### Step 6: Deploy!
1. Scroll down and click **"Create Web Service"** (green button)
2. Wait 2-5 minutes (watch the logs - it's fun!)
3. When it says "Your service is live", **COPY THE URL**
   - It will look like: `https://polaris-notes-backend.onrender.com`
   - ⚠️ **SAVE THIS URL** - you'll need it in the next step!

---

### PART 3: Deploy Frontend to Vercel.com

#### Step 1: Sign Up
1. Go to: **https://vercel.com**
2. Click **"Sign Up"**
3. Sign up with **GitHub** (easiest - connects automatically)

#### Step 2: Create Project
1. Click **"Add New..."** button
2. Click **"Project"**

#### Step 3: Import Your Code
1. Find your repository (`alexandra17-26/polarisnotes` or similar)
2. Click **"Import"**

#### Step 4: Configure Settings
Vercel should auto-detect everything, but verify:

- **Framework Preset:** `Vite` (should be auto-detected)
- **Root Directory:** `frontend` ⚠️ **VERY IMPORTANT!**
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `dist` (auto-detected)

#### Step 5: Add Backend URL (CRITICAL!)
1. Scroll down to **"Environment Variables"**
2. Click **"Add"** or **"Add New"**
3. Add this variable:

   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.onrender.com`
     - Replace `your-backend-url` with the URL you copied from Render
     - Example: `https://polaris-notes-backend.onrender.com`
   - **Environment:** Check ALL boxes (Production, Preview, Development)

#### Step 6: Deploy!
1. Click **"Deploy"** button
2. Wait 1-2 minutes
3. 🎉 **Your app is live!**
4. Copy your Vercel URL (looks like: `https://polaris-notes-xyz123.vercel.app`)

---

### PART 4: Connect Your Domain (polarisnotes.com)

#### Step 1: Add Domain in Vercel
1. Go to your Vercel project dashboard
2. Click **"Settings"** tab (top menu)
3. Click **"Domains"** (left sidebar)
4. In the input field, type: `polarisnotes.com`
5. Click **"Add"**

#### Step 2: Configure DNS at GoDaddy
Vercel will show you what DNS records to add. Here's what to do:

1. **Go to GoDaddy:**
   - Log in to your GoDaddy account
   - Go to: https://www.godaddy.com/en-us/myaccount/products
   - Find your domain `polarisnotes.com`
   - Click **"DNS"** or **"Manage DNS"**

2. **Add DNS Records:**
   
   **For the root domain (polarisnotes.com):**
   - Click **"Add"** or **"Add Record"**
   - **Type:** `A`
   - **Name:** `@` (or leave blank/empty)
   - **Value:** `76.76.21.21` (Vercel will show you the exact IP - use theirs!)
   - **TTL:** `600` (or default)
   - Click **"Save"**

   **For www (www.polarisnotes.com):**
   - Click **"Add"** or **"Add Record"** again
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com` (Vercel will show you the exact value - use theirs!)
   - **TTL:** `600` (or default)
   - Click **"Save"**

   ⚠️ **Important:** Vercel will show you the EXACT values to use. Use those, not the examples above!

#### Step 3: Wait for DNS
- DNS changes take 5 minutes to 48 hours to propagate
- Usually takes 10-30 minutes
- Vercel will show **"Valid Configuration"** when it's ready
- You can check status in Vercel → Settings → Domains

#### Step 4: SSL Certificate (Automatic!)
- Vercel automatically provides SSL certificates (HTTPS)
- This happens automatically after DNS is configured
- No action needed from you!
- Your site will be secure with the padlock 🔒

---

## Testing Your Deployment

### Test 1: Frontend Loads
1. Visit your Vercel URL or `https://polarisnotes.com`
2. The app should load without errors

### Test 2: Audio Recording
1. Click "Start Recording"
2. Speak something
3. Stop recording
4. Verify notes are generated

### Test 3: File Upload
1. Click "Upload Audio File"
2. Select an audio file
3. Verify it processes correctly

### Test 4: Note History
1. Create a few notes
2. Check "Note History" section
3. Verify notes are saved

---

## Troubleshooting

### ❌ Frontend can't connect to backend
**Fix:**
- Check `VITE_API_URL` is set correctly in Vercel
- Make sure backend URL has NO trailing slash (no `/` at the end)
- Check browser console (Press F12 → Console tab) for errors
- Verify backend is running (check Render dashboard → Logs)

### ❌ Backend errors
**Fix:**
- Check `OPENAI_API_KEY` is set correctly in Render
- Check Render logs for specific error messages
- Verify backend service is running (not sleeping - free tier sleeps after inactivity)

### ❌ Domain not working
**Fix:**
- Check DNS records are correct at GoDaddy
- Wait for DNS propagation (can take up to 48 hours, usually 10-30 min)
- Verify domain is added in Vercel Settings → Domains
- Check Vercel shows "Valid Configuration"

### ❌ Notes not saving
**Fix:**
- Check Render logs for file system errors
- Verify `backend/data/` folder exists (Render creates it automatically)
- Check file permissions in Render logs

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render.com
- [ ] Backend URL copied and saved
- [ ] `OPENAI_API_KEY` set in Render
- [ ] Frontend deployed to Vercel.com
- [ ] `VITE_API_URL` set in Vercel (pointing to Render backend URL)
- [ ] Custom domain `polarisnotes.com` added to Vercel
- [ ] DNS records configured at GoDaddy
- [ ] Tested audio recording
- [ ] Tested file upload
- [ ] Tested saving notes
- [ ] Verified custom domain works

---

## Important URLs to Save

**Backend URL (Render):** `https://____________________.onrender.com`  
**Frontend URL (Vercel):** `https://____________________.vercel.app`  
**Custom Domain:** `https://polarisnotes.com`

---

## Need Help?

- **Render Support:** https://render.com/docs
- **Vercel Support:** https://vercel.com/docs
- **Check logs:** Both platforms have built-in log viewers
- **Browser console:** Press F12 to see frontend errors

---

## Why This Setup?

**Render for Backend:**
- ✅ Supports persistent file storage (your app needs this)
- ✅ Free tier available
- ✅ Easy to set up
- ✅ Automatic HTTPS

**Vercel for Frontend:**
- ✅ Standard hosting for React apps
- ✅ Super fast CDN (content delivery network)
- ✅ Free tier available
- ✅ Easy custom domain setup
- ✅ Automatic HTTPS/SSL

**This is the industry standard setup for React + Node.js apps!**

---

**You've got this! Follow each step carefully and you'll have your app live at polarisnotes.com! 🚀**
