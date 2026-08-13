import { getSupabase } from './_lib/supabase.js';

export async function handler(event) {
  const id = event.queryStringParameters?.id;
  let destination = 'https://google.com';

  if (id) {
    try {
      const supabase = getSupabase();
      const { data: lead } = await supabase
        .from('leads')
        .select('website, clicked_at, click_count')
        .eq('tracking_id', id)
        .single();

      if (lead) {
        destination = /^https?:\/\//i.test(lead.website) ? lead.website : `https://${lead.website}`;
        await supabase
          .from('leads')
          .update({
            clicked_at: lead.clicked_at || new Date().toISOString(),
            click_count: (lead.click_count || 0) + 1,
          })
          .eq('tracking_id', id);
      }
    } catch {
      // fall through to default redirect
    }
  }

  return {
    statusCode: 302,
    headers: { Location: destination },
    body: '',
  };
}
