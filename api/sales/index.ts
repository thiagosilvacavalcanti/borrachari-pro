import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { authenticate } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const shopId = authenticate(req);

    if (req.method === 'POST') {
      const { customer, items: saleItems, payments, total, createdAt } = req.body;
      
      try {
        let customerId = customer.id;
        if (!customerId && (customer.name || customer.plate || customer.vehicle)) {
          const { data: newCust, error: custErr } = await supabase
            .from('customers')
            .insert([{ shop_id: shopId, name: customer.name || 'Consumidor', phone: customer.phone, plate: customer.plate, vehicle: customer.vehicle }])
            .select()
            .single();
          if (custErr) throw custErr;
          customerId = newCust.id;
        }

        const saleData: any = { shop_id: shopId, customer_id: customerId, total };
        if (createdAt) {
          saleData.created_at = createdAt;
        }

        const { data: sale, error: saleErr } = await supabase
          .from('sales')
          .insert([saleData])
          .select()
          .single();
        if (saleErr) throw saleErr;
        const saleId = sale.id;

        const saleItemsToInsert = saleItems.map((item: any) => ({
          sale_id: saleId,
          item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          commission_paid: (item.commission || 0) * item.quantity,
          wheels_count: item.wheels_count || 1,
          context: item.context
        }));

        const { error: itemsErr } = await supabase.from('sale_items').insert(saleItemsToInsert);
        if (itemsErr) throw itemsErr;

        // Update stock
        for (const item of saleItems) {
          if (item.type === 'product') {
            await supabase.rpc('decrement_stock', { item_id: item.id, amount: item.quantity });
          }
        }

        const paymentsToInsert = payments.map((p: any) => ({
          sale_id: saleId,
          method: p.method,
          amount: p.amount
        }));

        const { error: payErr } = await supabase.from('payments').insert(paymentsToInsert);
        if (payErr) throw payErr;

        return res.json({ id: saleId, success: true });
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message || 'Failed to process sale' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}
