// A lightweight, dependency-free SEO/AEO audit. Fetches the page HTML and
// pulls out the handful of signals the email generator needs: title, meta
// description, H1, whether the page is reachable, and basic AEO/GEO
// signals (structured data, FAQ schema, robots.txt, sitemap.xml).

function extract(regex, html) {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
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
    const res = await fetch(url, { redirect: 'follow' });
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
    const robotsRes = await fetch(new URL('/robots.txt', url).toString());
    result.hasRobotsTxt = robotsRes.status < 400;
  } catch {
    // ignore — treat as missing
  }

  try {
    const sitemapRes = await fetch(new URL('/sitemap.xml', url).toString());
    result.hasSitemap = sitemapRes.status < 400;
  } catch {
    // ignore — treat as missing
  }

  return result;
}
