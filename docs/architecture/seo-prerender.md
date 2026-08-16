# SEO, route metadata, and prerender delivery contract

**Status:** accepted through [ADR 0001](../adr/0001-astro-react-islands-and-shadcn.md).

**Owner:** product and web maintainers.

**Scope:** Astro static delivery on Cloudflare assets/Pages. React hydrates the
interactive tool islands only; it does not own document routing or metadata.

## Delivery model

- Astro statically emits an HTML document for the landing page, every
  `/explore/<slug>` `available` registry tool, and the real 404 page. Each tool
  document includes a visible h1 fallback and substantive guidance; React then
  mounts the interactive workspace and lazy-loads only that route's renderer.
- `/explore` is an emitted, indexable registry and implementation-status
  document. The `/explore/<slug>` namespace contains interactive tools. The
  prior `/tools` namespace is deliberately absent: it is neither emitted nor
  redirected, and resolves to the real 404 document.
- `@astrojs/sitemap` emits `sitemap-index.xml` from the generated routes, so
  the sitemap does not duplicate registry slugs by hand.
- `robots.txt` declares the public sitemap index.
- Cloudflare Pages hostnames receive `X-Robots-Tag: noindex` through
  `apps/web/public/_headers`; the public canonical origin is
  `https://kitland.dev`.
- There is no SPA fallback redirect. This is deliberate: a Pages `_redirects`
  catch-all would take precedence over static tool pages and collapse their
  metadata to the landing route.
- `BaseLayout.astro` owns title, description, canonical URL, Open Graph,
  Twitter card, JSON-LD, and the static CSP policy. Tool pages add
  `WebApplication`, `BreadcrumbList`, and `FAQPage` schemas from registry-owned
  content.

## Indexing requirements

- Every indexable route must have unique, human-written title/description and
  substantive static tool guidance. Do not add a registry entry until its SEO
  content exists; `requireToolSeoContent()` deliberately fails the build for a
  thin tool page.
- Canonicals must be absolute `https://kitland.dev` URLs with no query string,
  fragment, preview hostname, or trailing slash.
- Shared input fragments are client-only and must never alter canonical URLs,
  document metadata, or sitemap entries.
- Social previews use `/og-kitland-workbench.png`; replace it only with an
  asset whose dimensions and metadata are updated together.

## Regression gate

`pnpm --filter @kitland/web seo:check` runs against `dist/` after the Astro
build. It verifies that sitemap entries map to static documents, metadata and
canonical URLs are present, public `robots.txt`, `_headers`, and `404.html`
remain in the artifact, confirms `/explore` is a static sitemap-listed registry
instead of a redirect to the first tool, and verifies the Base64 route retains its
visible heading, structured data, Open Graph image, and no SPA redirect
artifact, including React streaming fallback scripts. CI must keep this gate
after build and before deployment. It also rejects any emitted or sitemap-listed
legacy `/tools` route. `bundle:check` adds entry-specific gzip budgets;
Playwright then exercises the built route rather than the development server.
