import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'rpg' }
});

export const STORAGE_BUCKET = 'media';

export const getStorageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/') || path.startsWith('assets/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  if (!path.includes('/')) {
    return `/assets/illustrations/${path}`;
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

