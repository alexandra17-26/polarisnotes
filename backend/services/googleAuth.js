import { OAuth2Client } from 'google-auth-library';

const clientId = process.env.GOOGLE_CLIENT_ID;
let client = null;

if (clientId) {
  client = new OAuth2Client(clientId);
}

export async function verifyGoogleIdToken(idToken) {
  if (!clientId || !client) {
    throw new Error('Google sign-in is not configured. Set GOOGLE_CLIENT_ID in your environment.');
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google ID token');
  }
  return payload;
}

