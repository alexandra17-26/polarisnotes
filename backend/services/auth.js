import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { usersDb } from './users.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'polaris-notes-dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Admin configuration – emails listed in ADMIN_EMAILS (comma-separated) are treated as admins
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(String(email).trim().toLowerCase());
};

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  const isAdmin = isAdminEmail(user.email);
  return jwt.sign(
    { userId: user.id, email: user.email, isAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function registerUser({ email, password, name, phone }) {
  const trimmedEmail = (email || '').trim().toLowerCase();
  const normalizedPhone = (phone || '').trim();

  if (!trimmedEmail && !normalizedPhone) {
    return { success: false, error: 'Email or phone number is required.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  if (trimmedEmail && usersDb.findByEmail(trimmedEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  if (normalizedPhone && usersDb.findByPhone(normalizedPhone)) {
    return { success: false, error: 'An account with this phone number already exists.' };
  }

  const passwordHash = await hashPassword(password);
  const user = usersDb.create({
    email: trimmedEmail || null,
    phone: normalizedPhone || null,
    passwordHash,
    name,
    provider: 'password',
  });
  const token = signToken(user);
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: isAdminEmail(user.email),
    },
    token,
  };
}

export async function loginUser({ identifier, password }) {
  const raw = (identifier || '').trim();
  if (!raw || !password) {
    return { success: false, error: 'Email or phone and password are required.' };
  }

  const isEmail = raw.includes('@');
  const lookup = isEmail ? raw.toLowerCase() : raw;
  const user = isEmail ? usersDb.findByEmail(lookup) : usersDb.findByPhone(lookup);

  // Allow login if user has passwordHash and isn't Google-only (older users may not have provider field)
  const canUsePassword = user && user.passwordHash && user.provider !== 'google';
  if (!canUsePassword || !(await verifyPassword(password, user.passwordHash))) {
    return { success: false, error: 'Invalid credentials.' };
  }

  const token = signToken(user);
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: isAdminEmail(user.email),
    },
    token,
  };
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token.', code: 'UNAUTHORIZED' });
  }
  const user = usersDb.findById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found.', code: 'UNAUTHORIZED' });
  }
  req.user = { id: user.id, email: user.email, name: user.name, isAdmin: isAdminEmail(user.email) };
  next();
}

/** Same as authMiddleware but does not reject: sets req.user when valid, otherwise req.user = null. Use for routes that work with or without login. */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  req.user = null;
  if (!token) return next();
  const payload = verifyToken(token);
  if (!payload) return next();
  const user = usersDb.findById(payload.userId);
  if (!user) return next();
  req.user = { id: user.id, email: user.email, name: user.name, isAdmin: isAdminEmail(user.email) };
  next();
}

// Admin-only middleware
export function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token.', code: 'UNAUTHORIZED' });
  }
  const user = usersDb.findById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found.', code: 'UNAUTHORIZED' });
  }
  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required.', code: 'FORBIDDEN' });
  }
  req.user = { id: user.id, email: user.email, name: user.name, isAdmin: true };
  next();
}

// Google login helper (used after verifying Google ID token)
export async function loginOrRegisterGoogleUser(googlePayload) {
  const email = (googlePayload?.email || '').trim().toLowerCase();
  const googleId = googlePayload?.sub;
  const name = googlePayload?.name || googlePayload?.given_name || null;

  if (!googleId || !email) {
    return { success: false, error: 'Invalid Google account data.' };
  }

  let user =
    usersDb.findByGoogleId(googleId) ||
    usersDb.findByEmail(email);

  if (!user) {
    user = usersDb.create({
      email,
      name,
      provider: 'google',
      googleId,
    });
  } else if (!user.googleId) {
    usersDb.update(user.id, { googleId, provider: 'google' });
    user = usersDb.findById(user.id);
  }

  const token = signToken(user);
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: isAdminEmail(user.email),
    },
    token,
  };
}
