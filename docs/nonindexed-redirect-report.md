# Non-Indexed Redirect Report

## Status

One small cleanup batch is ready for deployment.

## 2026-05-29 Legacy URL Cleanup

| URL                                              | Action                                                  | Evidence                                                                                             | Verification                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/services/`                                     | Restored as a live services hub instead of redirecting. | SEO Champion found the URL as `blocked_or_noindex` from GSC evidence and the live page returned 404. | Verify after deploy: `https://cartransport.au/services/` should return 200 and appear in the XML sitemap.  |
| `/interstate-car-transport-with-personal-items/` | 301 redirect to `/services/interstate/`.                | SEO Champion found Bing evidence and the live page returned 404; not present in XML sitemap.         | Verify after deploy: URL should 301 to `https://cartransport.au/services/interstate/`.                     |
| `/logo-preview/`                                 | Removed the public utility/dev preview route.           | Utility/dev preview page appeared as `sitemap_only` and is not a public SEO target.                  | Verify after deploy: `/logo-preview/` should return the site 404 and should not appear in `sitemap-0.xml`. |

## Notes

- Use this file to record future redirect-only cleanup work.
- Log the date, URL group, destination, and verification result for each batch.
