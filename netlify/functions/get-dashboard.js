import { getSupabase } from './_lib/supabase.js';

export async function handler() {
  try {
    const supabase = getSupabase();
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const stats = {
      total: leads.length,
      sent: leads.filter((l) => l.status === 'sent').length,
      failed: leads.filter((l) => l.status === 'failed').length,
      opened: leads.filter((l) => l.opened_at).length,
      clicked: leads.filter((l) => l.clicked_at).length,
    };

    return { statusCode: 200, body: JSON.stringify({ stats, leads }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
