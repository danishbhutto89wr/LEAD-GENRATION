// A lightweight, dependency-free SEO/AEO audit. Fetches the page HTML and
// pulls out the handful of signals the email generator needs: title, meta
// description, H1, whether the page is reachable, and basic AEO/GEO
// signals (structured data, FAQ schema, robots.txt, sitemap.xml).
//
// Every request has a hard timeout so one slow or unresponsive site can't
// hold up the whole batch.

function extract(regex, html) {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

async function fetchWithTimeout(url, ms = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function auditWebsite(rawUrl) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const result = {
    url,
    reachable: false,
    statusCode: null,
    title: null,
    metaDescription: null,
    h1: null,
    hasStructuredData: false,
    hasFaqSchema: false,
    hasRobotsTxt: false,
    hasSitemap: false,
  };

  try {
    const res = await fetchWithTimeout(url);
    result.statusCode = res.status;
    result.reachable = res.status < 400;

    if (result.reachable) {
      const html = await res.text();
      result.title = extract(/<title[^>]*>([^<]*)<\/title>/i, html);
      result.metaDescription = extract(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
        html
      );
      result.h1 = extract(/<h1[^>]*>([^<]*)<\/h1>/i, html);
      result.hasStructuredData = /application\/ld\+json/i.test(html);
      result.hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html);
    }
  } catch (err) {
    result.error = err.message;
  }

  try {
    const robotsRes = await fetchWithTimeout(new URL('/robots.txt', url).toString(), 4000);
    result.hasRobotsTxt = robotsRes.status < 400;
  } catch {
    // ignore — treat as missing
  }

  try {
    const sitemapRes = await fetchWithTimeout(new URL('/sitemap.xml', url).toString(), 4000);
    result.hasSitemap = sitemapRes.status < 400;
  } catch {
    // ignore — treat as missing
  }

  return result;
}
