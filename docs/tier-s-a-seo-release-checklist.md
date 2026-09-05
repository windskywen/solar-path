# Tier S + Tier A SEO Release Checklist

This release changes copy, metadata, internal links, and sitemap dates for existing public URLs only. It does not add a public route, change calculator logic, or activate AdSense.

## Before production deployment

- Export the preceding 28 days from Google Search Console for Query, Page, Country, and Device.
- Preserve the baseline for the three target URLs: `/`, `/sunrise-sunset-calculator`, and `/solar-azimuth-altitude`.
- Record organic clicks, impressions, CTR, average position, non-brand clicks, organic users, pageviews, pages per visitor, and top countries.
- Confirm the release commit passes `npm run typecheck`, `npm test -- --run`, `npm run lint`, `npm run build`, and `npm run test:e2e`.

## Post-deployment smoke test

- Confirm HTTP 200, one H1, correct title, meta description, canonical, and rendered supporting content on the three target URLs.
- Confirm the five synonym-only URLs remain 404 and absent from `sitemap.xml`.
- Confirm the six touched guides expose the `Use the live tool` section and its links resolve.
- Confirm review mode still exposes the AdSense account-verification meta but no AdSense script or ad slot.

## Search Console handoff

Inspect and request indexing in this order if quota is limited:

1. `/`
2. `/sunrise-sunset-calculator`
3. `/solar-azimuth-altitude`
4. `/guides/how-to-read-a-sun-path-diagram`
5. `/guides/brisbane-winter-vs-summer-sun-path`
6. Remaining touched guides

Freeze the three page titles and descriptions for at least 21–28 days unless a technical issue is found. Compare the next 28 days with the saved baseline by page and keyword cluster rather than judging a single day of ranking movement.
