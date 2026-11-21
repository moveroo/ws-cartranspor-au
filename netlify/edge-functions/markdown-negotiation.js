export default async (request, context) => {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (accept.includes('text/markdown')) {
    return context.rewrite('/index.md');
  }
  return context.next();
};
