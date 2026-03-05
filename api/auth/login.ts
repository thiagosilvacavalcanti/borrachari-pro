import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { supabase } from '../utils/supabase';
import { signToken } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  const { data: shop, error } = await supabase
    .from('shops')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !shop || !bcrypt.compareSync(password, shop.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken(shop.id);
  res.json({ token, shop: { id: shop.id, name: shop.name, email: shop.email } });
}
