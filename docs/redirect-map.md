# CarTransport.au Redirect Map

## Current Source Of Truth

CarTransport.au does not currently expose a dedicated redirect inventory file in the same way as some other fleet repos.

The current URL-governance pieces are:

- `vercel.json`
- `src/pages/robots.txt.ts`
- canonical and schema handling in the shared layout/components
- supporting analysis scripts in `scripts/`

## Active Redirects

| Source                                           | Destination             | Reason                                                                            |
| ------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------- |
| `/interstate-car-transport-with-personal-items`  | `/services/interstate/` | Legacy search-visible URL now consolidated into the live interstate service page. |
| `/interstate-car-transport-with-personal-items/` | `/services/interstate/` | Trailing-slash variant of the same legacy URL.                                    |

## Current Reading

This site already has a lot of SEO tooling, but the redirect and cutover process was not previously written down in the shared fleet format. If new canonical redirect rules are introduced later, document them here and keep them machine-readable from day one.
