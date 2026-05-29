# Non-Indexed Redirect Report

## Status

One small cleanup batch was prepared for deployment on 2026-05-30.

## 2026-05-29 Legacy URL Cleanup

| URL                                              | Action                                                                                                                                               | Evidence                                                                                                   | Verification                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/services/`                                     | Restored as a live services hub instead of redirecting.                                                                                              | SEO Champion found the URL as `blocked_or_noindex` from GSC evidence and the live page returned 404.       | Verify after deploy: `https://cartransport.au/services/` should return 200 and appear in the XML sitemap.  |
| `/interstate-car-transport-with-personal-items/` | Permanent Netlify redirect to `/services/interstate/`.                                                                                               | SEO Champion found Bing evidence and the live page returned 404; not present in XML sitemap.               | Verify after deploy: URL should redirect permanently to `https://cartransport.au/services/interstate/`.    |
| `/logo-preview/`                                 | Removed the public utility/dev preview route.                                                                                                        | Utility/dev preview page appeared as `sitemap_only` and is not a public SEO target.                        | Verify after deploy: `/logo-preview/` should return the site 404 and should not appear in `sitemap-0.xml`. |
| `/sitemap/`                                      | Excluded from the XML sitemap while keeping the human HTML sitemap page.                                                                             | HTML sitemap pages do not need to be indexed from the XML sitemap.                                         | Verify after deploy: `/sitemap/` should remain live but should not appear in `sitemap-0.xml`.              |
| `/contact/`                                      | Kept as an intentional operational handoff to the quoting app; public visible links now point directly to `https://quoting.cartransport.au/contact`. | Contact is handled by the quoting app, so internal links should not route through a redirecting local URL. | Verify after deploy: human-facing sitemap/navigation links should use the quoting contact URL directly.    |

## Notes

- Use this file to record future redirect-only cleanup work.
- Log the date, URL group, destination, and verification result for each batch.
