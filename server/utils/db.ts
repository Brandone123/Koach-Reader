import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Pool de connexion PostgreSQL pour les sessions
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Export pour la compatibilité avec le code existant
export const db = supabase;

// Health-check helper used by server/index.ts
export async function checkDb(): Promise<boolean> {
  const { error } = await supabase.from("users").select("id").limit(1);
  return !error;
}