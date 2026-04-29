/**
 * /api/ics-proxy — Fetches an ICS calendar feed and returns the raw text.
 *
 * This proxies the request through Cloudflare to avoid CORS issues
 * when fetching Google Calendar, Outlook, or other ICS feeds from the browser.
 *
 * GET /api/ics-proxy?url=https://calendar.google.com/calendar/ical/...
 */

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const icsUrl = url.searchParams.get('url');

  if (!icsUrl) {
    return new Response(JSON.stringify({ error: 'Missing "url" parameter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Basic validation — only allow http/https URLs
  if (!icsUrl.startsWith('http://') && !icsUrl.startsWith('https://')) {
    return new Response(JSON.stringify({ error: 'Invalid URL. Must start with http:// or https://' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(icsUrl, {
      headers: { 'Accept': 'text/calendar, text/plain, */*' },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Upstream returned ${res.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = await res.text();

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch ICS feed: ' + e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
