# 🚀 Complete Deployment Guide - Push to Production & Connect Domain

Follow these steps to deploy your app and connect your custom domain.

---

## 📋 Prerequisites

- ✅ Your code is ready
- ✅ You have a GitHub account
- ✅ You have a domain name purchased
- ✅ You have your OpenAI API key

---

## Part 1: Push Code to GitHub (if not already done)

1. **Open Terminal** and navigate to your project folder:
   ```bash
   cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program"
   ```

2. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   ```

3. **Create a GitHub repository:**
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it (e.g., `polaris-notes`)
   - **Don't** initialize with README
   - Click "Create repository"

4. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repo name)

---

## Part 2: Deploy Backend to Render

1. **Go to [render.com](https://render.com)** and sign up/login (free account)

2. **Click "New +" → "Web Service"**

3. **Connect GitHub:**
   - Click "Connect account" if needed
   - Authorize Render to access your GitHub
   - Select your repository

4. **Configure the service:**
   - **Name:** `polaris-notes-backend` (or any name you like)
   - **Root Directory:** `backend` ⚠️ **IMPORTANT!**
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or upgrade later)

5. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable":
   - `OPENAI_API_KEY` = `your-actual-openai-api-key-here`
   - `PORT` = `3001` (optional, Render sets this automatically)
   - `NODE_ENV` = `production`

6. **Click "Create Web Service"**

7. **Wait 2-5 minutes** for deployment (watch the logs)

8. **Copy your backend URL** - it will look like:
   `https://polaris-notes-backend.onrender.com`
   
   ⚠️ **Save this URL** - you'll need it in the next step!

---

## Part 3: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with GitHub

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository:**
   - Select your repository from the list
   - Click "Import"

4. **Configure the project:**
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `frontend` ⚠️ **IMPORTANT!**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Add Environment Variable:**
   - Click "Environment Variables"
   - Click "Add"
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.onrender.com` (paste the URL from Part 2, Step 8)
   - Click "Add"

6. **Click "Deploy"**

7. **Wait 1-2 minutes** - Your app is deploying!

8. **Once deployed, you'll see:**
   - ✅ "Congratulations! Your project has been deployed"
   - Your Vercel URL: `https://your-project-name.vercel.app`

9. **Test your deployment:**
   - Visit your Vercel URL
   - Try recording audio or uploading a file
   - Check if it works!

---

## Part 4: Connect Your Custom Domain to Vercel

### Step 1: Add Domain in Vercel

1. **In Vercel dashboard**, go to your project
2. Click **"Settings"** tab
3. Click **"Domains"** in the left sidebar
4. **Enter your domain** (e.g., `yourdomain.com` or `www.yourdomain.com`)
5. Click **"Add"**

### Step 2: Configure DNS Records

Vercel will show you DNS records to add. You'll need to add these in your domain registrar (where you bought the domain - GoDaddy, Namecheap, Google Domains, etc.)

**For Root Domain (yourdomain.com):**
- **Type:** `A`
- **Name:** `@` (or leave blank)
- **Value:** `76.76.21.21` (Vercel will show you the actual IP)

**For WWW (www.yourdomain.com):**
- **Type:** `CNAME`
- **Name:** `www`
- **Value:** `cname.vercel-dns.com` (Vercel will show you the actual value)

### Step 3: Add DNS Records at Your Domain Registrar

1. **Log into your domain registrar** (where you bought the domain)
2. **Find DNS settings** (might be called "DNS Management", "Name Servers", or "DNS Records")
3. **Add the records** Vercel provided:
   - Add the `A` record for root domain
   - Add the `CNAME` record for www
4. **Save changes**

### Step 4: Wait for DNS Propagation

- **This can take 5 minutes to 48 hours** (usually 10-30 minutes)
- Vercel will show "Valid Configuration" when it's ready
- You can check status in Vercel → Settings → Domains

### Step 5: Test Your Domain

Once DNS propagates:
- Visit `https://yourdomain.com` - should show your app!
- Visit `https://www.yourdomain.com` - should also work!

---

## Part 5: Connect Custom Domain to Backend (Optional)

If you want a custom subdomain for your backend (e.g., `api.yourdomain.com`):

1. **In Render dashboard**, go to your backend service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domains"**
4. Click **"Add Custom Domain"**
5. Enter: `api.yourdomain.com` (or `backend.yourdomain.com`)
6. **Add DNS record** at your domain registrar:
   - **Type:** `CNAME`
   - **Name:** `api` (or `backend`)
   - **Value:** Render will show you the CNAME value (looks like `your-service.onrender.com`)
7. **Update Vercel environment variable:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Update `VITE_API_URL` to `https://api.yourdomain.com`
   - Redeploy (or it will auto-redeploy)

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render
- [ ] Backend URL copied
- [ ] `OPENAI_API_KEY` set in Render
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set in Vercel
- [ ] Custom domain added in Vercel
- [ ] DNS records added at domain registrar
- [ ] DNS propagated (Vercel shows "Valid Configuration")
- [ ] App works at your custom domain!
- [ ] Tested recording/uploading audio
- [ ] Tested saving notes

---

## 🔧 Troubleshooting

### "Failed to process audio" error
- Check Render logs: Render dashboard → Your service → Logs
- Verify `OPENAI_API_KEY` is correct
- Check backend URL is correct in Vercel env vars

### Domain not working
- Wait longer for DNS propagation (can take up to 48 hours)
- Check DNS records are correct at your registrar
- Verify Vercel shows "Valid Configuration"
- Try clearing browser cache

### CORS errors
- Backend already has CORS enabled
- Make sure `VITE_API_URL` points to your Render backend
- Check browser console for specific errors

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend is running (visit Render URL directly)
- Check browser console for errors

### Notes not saving
- Check Render logs for errors
- Verify `backend/data/` folder exists (Render creates automatically)
- Check file permissions in Render logs

---

## 🎉 You're Done!

Your app is now live at your custom domain! Share it with your professor and classmates.

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Check deployment logs** in both platforms
- **Check browser console** for frontend errors
- **Check Render logs** for backend errors
