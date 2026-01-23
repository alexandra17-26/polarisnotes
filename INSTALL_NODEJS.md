# How to Install Node.js on Mac

## Method 1: Official Installer (Easiest - Recommended)

1. **Open your web browser** (Safari, Chrome, etc.)

2. **Go to this website:**
   ```
   https://nodejs.org/
   ```

3. **You'll see two green buttons:**
   - Click the **LEFT button** that says "LTS" (Long Term Support)
   - This is the recommended version

4. **Download the file:**
   - It will be named something like: `node-v20.x.x.pkg`
   - The file will download to your Downloads folder

5. **Install Node.js:**
   - Go to your Downloads folder
   - Double-click the `.pkg` file you just downloaded
   - Follow the installation wizard:
     - Click "Continue" on each screen
     - Enter your Mac password when asked
     - Click "Install"
     - Wait for it to finish
     - Click "Close"

6. **Restart Terminal:**
   - Close your Terminal window completely
   - Open a new Terminal window (Cmd + Space, type "Terminal")

7. **Verify it worked:**
   - In the new Terminal, type: `node --version`
   - Press Enter
   - You should see something like: `v20.11.0`
   - If you see this, Node.js is installed! ✅

## Method 2: Using Homebrew (If you have it)

If you already use Homebrew, you can install Node.js by typing:
```bash
brew install node
```

But if you don't know what Homebrew is, just use Method 1 above.

## After Installing Node.js

Once Node.js is installed, come back and we'll continue with setting up the application!
