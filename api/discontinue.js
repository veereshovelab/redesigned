import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { getSupabaseAdmin } from './_utils.js';

const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || 'vorynx-e937b';

const jwks = jwksClient({
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey ? key.getPublicKey() : (key.publicKey || key.rsaPublicKey);
    callback(null, signingKey);
  });
}

function verifyFirebaseToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: firebaseProjectId,
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      algorithms: ['RS256'],
      clockTolerance: 60 // tolerate 1 minute clock skew
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.body || {};
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // 1. Initialize Supabase Admin client securely
    const dbAdmin = getSupabaseAdmin();

    // 2. Verify Firebase token
    const decodedToken = await verifyFirebaseToken(token);
    const userEmail = decodedToken.email;
    const userId = decodedToken.user_id || decodedToken.sub;

    if (!userEmail || !userId) {
      return res.status(401).json({ error: 'Invalid token payload: missing email or user ID' });
    }

    // 3. Fetch the project to verify creator
    const { data: project, error: fetchError } = await dbAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Secure Ownership Check:
    // Verify against authenticated user ID or verified email (prevents display-name spoofing)
    const creatorEmail = project.creator_email || project.creator?.email;
    const creatorUid = project.creator_uid || project.creator_id || project.user_id;

    let isCreator = false;

    if (creatorUid) {
      isCreator = (userId === creatorUid);
    } else if (creatorEmail) {
      isCreator = (userEmail.toLowerCase() === creatorEmail.toLowerCase());
    } else {
      // Fallback for legacy seeded projects: check if creator_name matches AND email matches
      isCreator = (
        project.creator_name &&
        userEmail.toLowerCase().startsWith(project.creator_name.toLowerCase().replace(/\s+/g, ''))
      );
    }

    if (!isCreator) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to discontinue this campaign' });
    }

    // 4. Delete the project
    const { error: deleteError } = await dbAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true, message: 'Campaign discontinued successfully' });
  } catch (err) {
    console.error('Error in discontinue API:', err);
    const isJwtError = err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError' || err.message?.includes('token');
    const status = isJwtError ? 401 : 500;
    return res.status(status).json({ error: err.message || 'Unauthorized or server error' });
  }
}
