import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id: saleId } = req.query;

  try {
    const shopId = authenticate(req);

    if (req.method === 'PUT') {
      const { name, phone, plate, vehicle, date, payment_method, items: newItems } = req.body;
      
      try {
        // 1. Verify ownership
        const { data: sale, error: saleErr } = await supabase
          .from('sales')
          .select('id, shop_id, customer_id')
          .eq('id', saleId)
          .single();

        if (saleErr || !sale || sale.shop_id !== shopId) {
          throw new Error('Sale not found');
        }

        // 2. Update customer
        if (sale.customer_id) {
          await supabase.from('customers').update({ name, phone, plate, vehicle }).eq('id', sale.customer_id);
        }

        // 3. Update sale date
        if (date) {
          await supabase.from('sales').update({ created_at: date }).eq('id', saleId);
        }

        // 4. Handle items (stock reconciliation)
        const { data: oldItems } = await supabase
          .from('sale_items')
          .select('id, item_id, quantity, items(type)')
          .eq('sale_id', saleId);

        if (oldItems) {
          for (const item of oldItems) {
            if ((item.items as any).type === 'product') {
              await supabase.rpc('increment_stock', { item_id: item.item_id, amount: item.quantity });
            }
          }
        }

        await supabase.from('sale_items').delete().eq('sale_id', saleId);

        let newTotal = 0;
        for (const item of newItems) {
          const { data: itemInfo } = await supabase.from('items').select('type, commission').eq('id', item.item_id).single();
          const commission = itemInfo?.commission || 0;
          const commission_paid = commission * item.quantity;
          
          await supabase.from('sale_items').insert([{
            sale_id: saleId,
            item_id: item.item_id,
            quantity: item.quantity,
            price: item.price,
            wheels_count: item.wheels_count,
            commission_paid
          }]);

          if (itemInfo?.type === 'product') {
            await supabase.rpc('decrement_stock', { item_id: item.item_id, amount: item.quantity });
          }
          newTotal += item.price * item.quantity;
        }

        // 5. Update sale total
        await supabase.from('sales').update({ total: newTotal }).eq('id', saleId);

        // 6. Update payments
        await supabase.from('payments').delete().eq('sale_id', saleId);
        await supabase.from('payments').insert([{
          sale_id: saleId,
          method: payment_method || 'money',
          amount: newTotal
        }]);

        return res.json({ success: true });
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message || 'Failed to update sale' });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const { data: sale, error: saleErr } = await supabase
          .from('sales')
          .select('id, shop_id')
          .eq('id', saleId)
          .single();

        if (saleErr || !sale || sale.shop_id !== shopId) {
          throw new Error('Sale not found');
        }

        const { data: items } = await supabase
          .from('sale_items')
          .select('item_id, quantity, items(type)')
          .eq('sale_id', saleId);

        if (items) {
          for (const item of items) {
            if ((item.items as any).type === 'product') {
              await supabase.rpc('increment_stock', { item_id: item.item_id, amount: item.quantity });
            }
          }
        }

        await supabase.from('sale_items').delete().eq('sale_id', saleId);
        await supabase.from('payments').delete().eq('sale_id', saleId);
        await supabase.from('sales').delete().eq('id', saleId);

        return res.json({ success: true });
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message || 'Failed to delete sale' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
