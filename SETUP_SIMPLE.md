# Simple setup: what to put where (no coding needed)

This tells you exactly what to type into the backend and frontend so the app runs and you can sign in.

---

## 1. Backend folder: `backend/.env`

The backend already has a file named `.env`. It should contain **only lines like KEY=value** (no commands, no extra text).

**You need:**

| What to type        | Meaning |
|---------------------|--------|
| `PORT=3001`         | Server runs on port 3001. (You can leave this as is.) |
| `OPENAI_API_KEY=sk-...` | Your OpenAI API key so the app can generate notes. You already have this. |

**Optional (you can skip these for now):**

| What to type        | Meaning |
|---------------------|--------|
| `JWT_SECRET=any-long-random-string` | Makes login tokens secure. If you don’t add it, the app uses a default. |
| `GOOGLE_CLIENT_ID=...` | Only if you want “Sign in with Google.” Leave it out if you only use email/password. |

**Rules:**

- One setting per line.
- No spaces around the `=`.
- Do **not** put `cd`, `npm start`, or any other commands in `.env` — only KEY=value lines.

**Example of a correct `backend/.env`:**

```
PORT=3001
OPENAI_API_KEY=sk-proj-your-key-here
```

---

## 2. Frontend folder: `frontend/.env` (optional)

You don’t have to create this file. The app works without it (email/password sign-in works).

**Create it only if you want “Sign in with Google”:**

1. In the `frontend` folder, create a new file named exactly: `.env`
2. Put this in it (replace with your real Google Client ID if you have one):

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

If you don’t use Google sign-in, leave the frontend without a `.env` file.

**If you later deploy and put the frontend on a different website than the backend**, you can add:

```
VITE_API_URL=https://your-backend-url.com
```

For running on your own computer, you usually **don’t** need this.

---

## 3. How to run the app (no coding)

**Backend (must be running first):**

1. Open a terminal (or Command Prompt).
2. Go to the backend folder, for example:
   - Mac: `cd "/Users/alexandrashor/Desktop/Polaris Ideas Project/Notetaking AI Program/backend"`
   - Or in Cursor: open a terminal and type `cd backend`
3. Run: `npm start`
4. Leave this window open. When you see something like “Server running on http://localhost:3001”, the backend is ready.

**Frontend:**

1. Open **another** terminal.
2. Go to the frontend folder: `cd frontend` (or the full path to the `frontend` folder).
3. Run: `npm install` (only the first time, to install packages).
4. Run: `npm run dev`
5. Open the link it shows (usually http://localhost:3000) in your browser.

Then you can sign up and sign in with **email + password** on the app. You don’t need to type any code — only the values in the `.env` files and these commands.

---

## Quick checklist

- **Backend `.env`**: Has `PORT=3001` and `OPENAI_API_KEY=your-key`. Nothing else (no `cd`, no `npm start`).
- **Frontend `.env`**: Optional. Only needed for Google sign-in or for production `VITE_API_URL`.
- **Run backend**: Terminal → `cd backend` → `npm start`.
- **Run frontend**: Other terminal → `cd frontend` → `npm run dev` → open the URL in the browser.
