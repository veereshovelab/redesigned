import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Searches upwards from process.cwd() and import.meta.url for specified env file
 * @param {string} filename 
 * @returns {string|null}
 */
export function findEnvFile(filename) {
  let dir = process.cwd();
  while (true) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) return fullPath;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    let currentDir = path.dirname(__filename);
    while (true) {
      const fullPath = path.join(currentDir, filename);
      if (fs.existsSync(fullPath)) return fullPath;
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  } catch (err) {
    console.debug("Could not resolve env file relative to import.meta.url:", err);
  }

  return null;
}

/**
 * Safely parses .env files handling values containing '=' signs
 */
export function loadEnv() {
  ['.env', '.env.local'].forEach(file => {
    try {
      const envPath = findEnvFile(file);
      if (envPath) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const firstEq = trimmed.indexOf('=');
          if (firstEq !== -1) {
            const key = trimmed.substring(0, firstEq).trim();
            let val = trimmed.substring(firstEq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      }
    } catch (err) {
      console.error(`Error loading env file ${file} manually:`, err);
    }
  });
}

// Auto-load env on import
loadEnv();

let supabaseAdmin;

/**
 * Returns singleton Supabase Admin client with service role key or anon fallback
 */
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials in serverless environment.");
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}
