import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
const usersFile = join(dataDir, 'users.json');

fs.ensureDirSync(dataDir);
if (!fs.existsSync(usersFile)) {
  fs.writeJsonSync(usersFile, []);
}

const readUsers = () => {
  try {
    return fs.readJsonSync(usersFile);
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeJsonSync(usersFile, users, { spaces: 2 });
};

const normalizeEmail = (email) =>
  (email || '').trim().toLowerCase() || null;

const normalizePhone = (phone) => {
  if (!phone) return null;
  return String(phone).replace(/\s+/g, '');
};

export const usersDb = {
  findByEmail: (email) => {
    const users = readUsers();
    const target = normalizeEmail(email);
    if (!target) return null;
    return users.find(u => (u.email || '').toLowerCase() === target) || null;
  },

  findByPhone: (phone) => {
    const users = readUsers();
    const target = normalizePhone(phone);
    if (!target) return null;
    return users.find(u => normalizePhone(u.phone) === target) || null;
  },

  findByGoogleId: (googleId) => {
    const users = readUsers();
    if (!googleId) return null;
    return users.find(u => u.googleId === googleId) || null;
  },

  findById: (id) => {
    const users = readUsers();
    return users.find(u => u.id === id) || null;
  },

  create: (data) => {
    const users = readUsers();
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const user = {
      id,
      email: normalizeEmail(data.email),
      phone: normalizePhone(data.phone),
      passwordHash: data.passwordHash || null,
      name: (data.name || '').trim() || null,
      provider: data.provider || 'password',
      googleId: data.googleId || null,
      created_at: new Date().toISOString(),
    };
    users.push(user);
    writeUsers(users);
    return user;
  },

  update: (id, updates) => {
    const users = readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    const allowed = ['name', 'passwordHash', 'phone', 'provider', 'googleId', 'email'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (key === 'email') {
          users[index].email = normalizeEmail(updates[key]);
        } else if (key === 'phone') {
          users[index].phone = normalizePhone(updates[key]);
        } else {
          users[index][key] = updates[key];
        }
      }
    }
    users[index].updated_at = new Date().toISOString();
    writeUsers(users);
    return users[index];
  },
};

export default usersDb;
