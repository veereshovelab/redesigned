import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
const isValidKey = rawKey.length > 10 && !rawKey.includes('your_');

if (!isValidUrl || !isValidKey) {
  console.warn("Supabase credentials missing or unconfigured. Operating in local sandbox mode.");
}

// Fallback dummy credentials prevent createClient from throwing uncaught startup exception
const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isValidKey ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
