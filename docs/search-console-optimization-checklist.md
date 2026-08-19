# Search Console optimization gates

This checklist keeps performance, SEO metadata, and AdSense changes separated so that a short-lived
Search Console movement is not mistaken for a release regression. It complements
`docs/adsense-release-checklist.md`.

## Baseline captured on 19 August 2026

The exported 28-day report covers 20 July through 16 August 2026.

- Property total: 458 clicks, 13,669 impressions, 3.4% CTR, average position 14.3.
- Home page: 430 clicks, 11,563 impressions, 3.72% CTR, average position 12.93.
- Sunrise/Sunset Calculator: 24 clicks, 1,748 impressions, 1.37% CTR, average position 22.99.
- Mobile: 262 clicks, 5,233 impressions, 5.01% CTR, average position 8.24.
- Desktop: 181 clicks, 8,339 impressions, 2.17% CTR, average position 18.2.
- `sun tracker`: 7 clicks, 594 impressions, 1.18% CTR, average position 18.06.
- Search Console Core Web Vitals: mobile URL group INP 320 ms; desktop URLs are good.
- Sitemap: successful, 16 discovered URLs; 14 pages indexed at the time of inspection.
- External authority: two linking sites were visible in Search Console.

Query rows omit anonymized searches and therefore must not be reconciled directly to property totals.
The 12 August peak is an outlier and is excluded from the comparison windows below.

## Performance release acceptance

- [ ] Deploy `@vercel/speed-insights` with `sampleRate={1}`; Speed Insights is enabled for the
      linked Vercel project.
- [ ] Keep the 2D map camera uncontrolled and confirm pan/zoom does not update React state per frame.
- [ ] Confirm Recharts is absent from calculator initial scripts and loads when the deferred panel is
      within 300 px of the viewport.
- [ ] Confirm the 3D modal code loads only after the first 3D View request.
- [ ] Confirm browser zoom is not restricted by `maximumScale`.
- [ ] Preserve all map, search, date, hour, 3D, calculator, and geocoding contracts.
- [ ] Keep `NEXT_PUBLIC_ADSENSE_ENABLED=false`, preserve the verification meta, and render no
      AdSense script or slot while review is pending.
- [ ] After deployment, test production canonicals, sitemap, review-mode advertising, console errors,
      horizontal overflow, and layout shift.

Evaluate field performance after 100 mobile INP samples. If fewer than 100 samples exist after 14
complete days, use all available field samples together with a controlled mobile trace. The target is
mobile p75 INP at or below 200 ms. Start Search Console INP validation only after field evidence shows
the fix is working.

## Metadata decision gate

Do not change the current titles or descriptions before the post-release data window is complete.
The first evaluation can run after Search Console has complete data for 15–28 August 2026, expected
on or after 31 August. Compare it with 29 July–11 August and exclude 12–14 August as the outlier and
release-transition period.

Use page totals for page performance and visible query rows only for the named query decisions.

### Home page

- If `sun tracker` has at least 300 impressions, average position 10–20, and CTR below 2%, test:
  - title: `Sun Tracker & 3D Sun Path Map`
  - description: `Track the sun’s path, direction, azimuth and altitude on an interactive map for any location, date and time. Free, no sign-up.`
- If its average position is worse than 20, keep the existing metadata and prioritize authority.
- If the impression threshold or CTR/position condition is not met, keep the existing metadata.

### Calculator pages

- Change the Sunrise/Sunset title to `Sunrise & Sunset Calculator by Location` only after at least
  500 impressions, a top-10 average position, and CTR below 2%.
- If average position remains outside the top 10, keep the snippet and treat it as a ranking problem.
- Do not change Golden Hour metadata before it has at least 300 impressions.

Do not create synonym-only routes, mass city pages, translations, or hreflang during this cycle.

## Indexing and AdSense gates

- [ ] After the performance release is live, inspect `/about` and `/privacy`, run Test Live URL, and
      request indexing.
- [ ] Do not validate expected redirects, `ads.txt`, or favicon exclusions.
- [ ] Do not resubmit the successful sitemap unless its URL or status changes.
- [ ] If AdSense becomes Ready, follow the separate post-approval activation section in
      `docs/adsense-release-checklist.md`.
- [ ] If AdSense is rejected, capture the exact account/Policy Center reason before changing content.
- [ ] Build `/guides/global-daylight-golden-hour-comparison` only after the AdSense decision, or after
      28 pending-review days, while keeping review-mode wiring unchanged.
- [ ] Do not send external outreach without separate authorization.
