# 🚀 Deploy to Vercel - Step by Step Guide

## ⚠️ Important: File Storage Limitation

Your backend uses **file system storage** (JSON files and uploads). Vercel serverless functions are **stateless** - files won't persist.

**Best Solution:** Deploy backend on **Render** (free, persistent storage) and frontend on **Vercel**.

---

## 📋 Step-by-Step Instructions

### Part 1: Deploy Backend to Render (5 minutes)

1. **Go to [render.com](https://render.com)** and sign up (free)

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository:**
   - Click "Connect account" if needed
   - Select your repository

4. **Configure the service:**
   - **Name:** `polaris-notes-backend` (or any name)
   - **Root Directory:** `backend` ⚠️ Important!
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable":
   - `OPENAI_API_KEY` = `your-actual-openai-api-key`
   - `PORT` = `3001` (optional, Render sets this automatically)
   - `NODE_ENV` = `production`

6. **Click "Create Web Service"**

7. **Wait 2-5 minutes** for deployment

8. **Copy your backend URL** (looks like: `https://polaris-notes-backend.onrender.com`)

---

### Part 2: Deploy Frontend to Vercel (3 minutes)

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository**

4. **Configure:**
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `frontend` ⚠️ Important!
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

5. **Add Environment Variable:**
   - Click "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com` (from Part 1, Step 8)

6. **Click "Deploy"**

7. **Wait 1-2 minutes** - Your app is live! 🎉

8. **Visit your Vercel URL** (looks like: `https://your-project.vercel.app`)

---

### Part 3: Update Frontend to Use Backend URL (if needed)

The frontend currently uses relative paths (`/api/...`). If your backend is on Render (different domain), you need to update the API calls.

**Option A: Quick Fix (Recommended)**
The `frontend/src/api.js` file is already created. You just need to update imports:

1. Open `frontend/src/components/AudioRecorder.jsx`
2. Change `import axios from 'axios'` to `import api from '../api'`
3. Change `axios.post(...)` to `api.post(...)`
4. Repeat for other files that use axios

**Option B: Keep Relative Paths (if backend is on same domain)**
If you deploy both on Vercel (not recommended due to file storage), relative paths will work.

---

## ✅ Testing Your Deployment

1. **Visit your Vercel URL**
2. **Try recording audio** - should work!
3. **Try uploading a file** - should work!
4. **Check Note History** - notes should save and persist

---

## 🔧 Troubleshooting

### "Failed to process audio" error
- Check Render logs: Go to Render dashboard → Your service → Logs
- Verify `OPENAI_API_KEY` is set correctly in Render
- Check that backend URL is correct in Vercel environment variables

### CORS errors
- Backend already has CORS enabled, should work
- If issues persist, check Render service is running

### Notes not saving
- Check Render logs for errors
- Verify `backend/data/` folder exists (Render creates it automatically)
- Check file permissions in Render logs

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set in Vercel
- Check backend URL is correct (no trailing slash)
- Check browser console for errors

---

## 📝 Quick Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL copied
- [ ] `OPENAI_API_KEY` set in Render
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set in Vercel (pointing to Render backend)
- [ ] Tested recording audio
- [ ] Tested uploading file
- [ ] Tested saving notes

---

## 🎯 Next Steps

1. **Set up custom domain** (optional):
   - Vercel: Project Settings → Domains
   - Render: Settings → Custom Domain

2. **Monitor usage:**
   - Render free tier: 750 hours/month
   - Vercel free tier: Generous limits

3. **Consider upgrading** if you get traffic:
   - Render: $7/month for always-on (no sleep)
   - Vercel: Pro plan for more features

---

## 💡 Alternative: Both on Vercel (Not Recommended)

If you really want both on Vercel:

1. Deploy as monorepo (use the `vercel.json` config)
2. **⚠️ File storage will reset on each deployment**
3. Consider migrating to MongoDB Atlas or Supabase for data storage
4. Use Vercel Blob Storage for file uploads

**This requires code changes** - not recommended for quick deployment.

---

## 🆘 Need Help?

- Check deployment logs in both platforms
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
- Check browser console for frontend errors
- Check Render logs for backend errors
