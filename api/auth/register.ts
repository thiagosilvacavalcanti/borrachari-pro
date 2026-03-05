import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { supabase } from '../utils/supabase';
import { signToken } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from('shops')
      .insert([{ name, email, password: hashedPassword }])
      .select()
      .single();

    if (error) throw error;

    const token = signToken(data.id);
    res.json({ token, shop: { id: data.id, name, email } });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: 'Email already exists or error creating shop' });
  }
}
