import { getSupabase } from './_lib/supabase.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { text } = JSON.parse(event.body || '{}');
    if (!text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No data provided.' }) };
    }

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const leads = [];
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) continue;
      const [email, website] = parts;
      leads.push({ email, website });
    }

    if (leads.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No valid "email, website" lines found.' }),
      };
    }

    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from('batches')
      .select('batch_number')
      .order('batch_number', { ascending: false })
      .limit(1);

    let nextBatchNumber = existing && existing.length ? existing[0].batch_number + 1 : 1;

    const batchSize = 5;
    const createdBatches = [];

    for (let i = 0; i < leads.length; i += batchSize) {
      const chunk = leads.slice(i, i + batchSize);

      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .insert({ batch_number: nextBatchNumber, status: 'pending' })
        .select()
        .single();

      if (batchError) throw batchError;

      const leadRows = chunk.map((l) => ({
        batch_id: batch.id,
        email: l.email,
        website: l.website,
        status: 'pending',
      }));

      const { error: leadsError } = await supabase.from('leads').insert(leadRows);
      if (leadsError) throw leadsError;

      createdBatches.push(batch);
      nextBatchNumber += 1;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ createdBatches: createdBatches.length, totalLeads: leads.length }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
