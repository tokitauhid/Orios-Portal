/**
 * Proxy an ICS feed so the browser can read it without CORS issues.
 * Usage: GET /api/ics-proxy?url=<calendar-url>
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

  // Only allow absolute HTTP(S) URLs.
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
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour to reduce repeated upstream fetches.
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
