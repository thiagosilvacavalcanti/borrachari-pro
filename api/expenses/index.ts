import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const shopId = authenticate(req);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    if (req.method === 'POST') {
      const { description, amount, category } = req.body;
      if (!description || !amount) {
        return res.status(400).json({ error: 'Descrição e valor são obrigatórios' });
      }
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ shop_id: shopId, description, amount, category: category || 'Geral' }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
