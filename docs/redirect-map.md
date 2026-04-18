# CarTransport.au Redirect Map

## Current Source Of Truth

CarTransport.au does not currently expose a dedicated redirect inventory file in the same way as some other fleet repos.

The current URL-governance pieces are:

- `src/pages/robots.txt.ts`
- canonical and schema handling in the shared layout/components
- supporting analysis scripts in `scripts/`

## Current Reading

This site already has a lot of SEO tooling, but the redirect and cutover process was not previously written down in the shared fleet format. If new canonical redirect rules are introduced later, document them here and keep them machine-readable from day one.
