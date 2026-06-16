import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manual Env Loader as a fallback for Vercel CLI local env binding issues
function findEnvFile(filename) {
  // Start from process.cwd()
  let dir = process.cwd();
  while (true) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback to starting from current file directory
  try {
    const __filename = fileURLToPath(import.meta.url);
    let currentDir = path.dirname(__filename);
    while (true) {
      const fullPath = path.join(currentDir, filename);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  } catch (err) {
    console.debug("Could not resolve env file relative to import.meta.url:", err);
  }

  return null;
}

function loadEnv() {
  ['.env', '.env.local'].forEach(file => {
    try {
      const envPath = findEnvFile(file);
      if (envPath) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join('=').trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            if (val.startsWith("'") && val.endsWith("'")) {
              val = val.substring(1, val.length - 1);
            }
            process.env[key] = val;
          }
        });
      }
    } catch (err) {
      console.error(`Error loading env file ${file} manually:`, err);
    }
  });
}

loadEnv();

const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || 'vorynx-e937b';

let supabaseAdmin;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials in serverless environment.");
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

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

  const { projectId } = req.body;
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
    const userDisplayName = decodedToken.name;

    if (!userEmail) {
      return res.status(401).json({ error: 'Invalid token payload' });
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

    // Check if user is the creator
    const emailPrefix = userEmail.split('@')[0];
    const isCreator = (
      userDisplayName === project.creator_name ||
      emailPrefix === project.creator_name
    );

    if (!isCreator) {
      return res.status(403).json({ error: 'Forbidden: You are not the creator of this campaign' });
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
