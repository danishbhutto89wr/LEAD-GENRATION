import { getSupabase } from './_lib/supabase.js';

export async function handler() {
  try {
    const supabase = getSupabase();

    const { data: batches, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .order('batch_number', { ascending: true });
    if (batchError) throw batchError;

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true });
    if (leadsError) throw leadsError;

    const result = batches.map((batch) => ({
      ...batch,
      leads: leads.filter((l) => l.batch_id === batch.id),
    }));

    return { statusCode: 200, body: JSON.stringify({ batches: result }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
