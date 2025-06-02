import { supabase } from '../utils/db';
import { Request, Response } from 'express';

// Inscription
export const signUp = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) return res.status(400).json({ error });
  res.json(data);
};

// Connexion
export const signIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json({ error });
  res.json(data);
};