// Exchanges the stored refresh token for a fresh access token, then sends
// a MIME email through the Gmail API. No extra npm packages needed —
// just the built-in fetch that Netlify's Node runtime provides.

async function getAccessToken() {
  const params = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Gmail token refresh failed: ${data.error_description || data.error || res.status}`
    );
  }
  return data.access_token;
}

function base64UrlEncode(str) {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmail({ to, subject, html }) {
  const accessToken = await getAccessToken();
  const from = process.env.GMAIL_SENDER_EMAIL;

  const messageLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ];

  const raw = base64UrlEncode(messageLines.join('\r\n'));

  const res = await fetch(
    'https://www.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gmail send failed: ${data.error?.message || res.status}`);
  }
  return data;
}
