import { getSupabase } from './_lib/supabase.js';

const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
  'base64'
);

export async function handler(event) {
  const id = event.queryStringParameters?.id;

  if (id) {
    try {
      const supabase = getSupabase();
      const { data: lead } = await supabase
        .from('leads')
        .select('opened_at, open_count')
        .eq('tracking_id', id)
        .single();

      if (lead) {
        await supabase
          .from('leads')
          .update({
            opened_at: lead.opened_at || new Date().toISOString(),
            open_count: (lead.open_count || 0) + 1,
          })
          .eq('tracking_id', id);
      }
    } catch {
      // Tracking should never break the pixel response.
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
    body: PIXEL.toString('base64'),
    isBase64Encoded: true,
  };
}
