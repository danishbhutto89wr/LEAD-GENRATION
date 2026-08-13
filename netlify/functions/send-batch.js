import { getSupabase } from './_lib/supabase.js';
import { auditWebsite } from './_lib/audit.js';
import { generateEmailContent } from './_lib/anthropic.js';
import { sendGmail } from './_lib/gmail.js';

function buildEmailHtml({ opening_line, findings_summary, closing_line }, trackingId, siteUrl) {
  const pixelUrl = `${siteUrl}/api/track-open?id=${trackingId}`;
  const clickUrl = `${siteUrl}/api/track-click?id=${trackingId}`;

  return `
  <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937; max-width: 560px;">
    <p>${opening_line}</p>
    <p>${findings_summary}</p>
    <p>
      <a href="${clickUrl}" style="color: #0ea5a5; font-weight: bold;">See the full free report &rarr;</a>
    </p>
    <p>${closing_line}</p>
    <img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />
  </div>`;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const supabase = getSupabase();
  const siteUrl = process.env.PUBLIC_SITE_URL || '';

  try {
    const { batch_id } = JSON.parse(event.body || '{}');
    if (!batch_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'batch_id is required.' }) };
    }

    await supabase.from('batches').update({ status: 'sending' }).eq('id', batch_id);

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('batch_id', batch_id);
    if (error) throw error;

    const results = [];

    for (const lead of leads) {
      try {
        await supabase.from('leads').update({ status: 'sending' }).eq('id', lead.id);

        const audit = await auditWebsite(lead.website);
        const content = await generateEmailContent(audit, lead.website);
        const html = buildEmailHtml(content, lead.tracking_id, siteUrl);

        await sendGmail({ to: lead.email, subject: content.subject, html });

        await supabase
          .from('leads')
          .update({
            status: 'sent',
            subject: content.subject,
            email_body: html,
            audit_data: audit,
            sent_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        results.push({ id: lead.id, email: lead.email, status: 'sent' });
      } catch (leadErr) {
        await supabase
          .from('leads')
          .update({ status: 'failed', error_message: leadErr.message })
          .eq('id', lead.id);
        results.push({ id: lead.id, email: lead.email, status: 'failed', error: leadErr.message });
      }
    }

    const allSent = results.every((r) => r.status === 'sent');
    await supabase
      .from('batches')
      .update({ status: allSent ? 'sent' : 'partial' })
      .eq('id', batch_id);

    return { statusCode: 200, body: JSON.stringify({ results }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
