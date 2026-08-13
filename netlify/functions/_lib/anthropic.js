// Asks Google Gemini (free tier) to write the personalized parts of the
// outreach email based on the audit findings. Returns a small JSON object
// that gets slotted into the fixed HTML template in send-batch.js.

export async function generateEmailContent(audit, website) {
  const findings = [];
  if (!audit.title) findings.push('missing or empty <title> tag');
  if (!audit.metaDescription) findings.push('missing meta description');
  if (!audit.h1) findings.push('missing H1 heading');
  if (!audit.hasStructuredData) findings.push('no structured data (schema.org) found');
  if (!audit.hasFaqSchema) findings.push('no FAQ schema for AI answer engines');
  if (!audit.hasRobotsTxt) findings.push('no robots.txt found');
  if (!audit.hasSitemap) findings.push('no sitemap.xml found');
  if (!audit.reachable) findings.push(`site returned an error (status ${audit.statusCode ?? 'unknown'})`);

  const prompt = `You are writing a short, friendly cold outreach email for a website SEO/AEO audit service.

Website audited: ${website}
Findings from the automated audit:
${findings.length ? findings.map((f) => `- ${f}`).join('\n') : '- No major issues found; site looks reasonably well optimized.'}

Write JSON only, no other text, no markdown code fences, in this exact shape:
{"subject": "short subject line under 60 characters", "opening_line": "one warm, specific opening sentence referencing the site", "findings_summary": "2-3 sentences in plain language summarizing the 2-3 most important findings and why they matter for search/AI visibility", "closing_line": "one short closing sentence inviting a reply, no signature"}

Keep the tone helpful and non-salesy, avoid jargon, and do not exaggerate the findings.`;

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const apiKey = process.env.GEMINI_API_KEY;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini API error: ${data.error?.message || res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}';
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      subject: `A few notes on ${website}`,
      opening_line: `I took a quick look at ${website} and wanted to share a couple of findings.`,
      findings_summary: findings.length
        ? `A few things stood out: ${findings.slice(0, 3).join(', ')}.`
        : 'Overall the site looks solid, with just a couple of small opportunities.',
      closing_line: 'Happy to send over the full report if that would be useful — just reply to this email.',
    };
  }
}
