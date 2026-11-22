function ensureVaryAccept(headers) {
  const existing = headers.get('vary') || '';
  const tokens = existing
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  if (!tokens.some((token) => token.toLowerCase() === 'accept')) {
    tokens.unshift('Accept');
  }
  headers.set('Vary', tokens.join(', '));
  headers.set('Netlify-Vary', 'header=accept');
}

export default async (request, context) => {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  const response = accept.includes('text/markdown')
    ? await fetch(new URL('/index.md', request.url), {
        method: request.method,
        headers: { Accept: 'text/markdown' },
      })
    : await context.next();

  const headers = new Headers(response.headers);
  ensureVaryAccept(headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
