# AdSense release checklist

This checklist separates code readiness from the external Google account steps that cannot be completed in the repository. Google approval is not guaranteed.

## 1. Review deployment

- [ ] Keep `NEXT_PUBLIC_ADSENSE_ENABLED=false`.
- [ ] Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` to the approved `ca-pub-...` publisher ID.
- [ ] Leave `NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID`, `NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID`, and `NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID` empty.
- [ ] Deploy the production build and confirm the publisher pages contain the `google-adsense-account` meta tag.
- [ ] Confirm no AdSense script, `<ins class="adsbygoogle">`, or empty advertisement container is rendered in review mode.
- [ ] Confirm the home page exposes its reproducible report and CSV only after a valid solar dataset exists.
- [ ] Confirm all three calculators and all six guide details expose page-specific evidence and a deterministic CSV.
- [ ] Confirm `/ads.txt`, `/robots.txt`, and `/sitemap.xml` return HTTP 200.
- [ ] Confirm the home page, all three calculators, all six guides, `/about`, `/methodology`, `/contact`, `/privacy`, and `/terms` return HTTP 200.
- [ ] Run desktop and mobile checks for console errors, hydration errors, horizontal overflow, and layout shift.

## 2. AdSense account setup before requesting review

- [ ] In AdSense Sites, verify the site with the meta tag or `ads.txt` and wait for the connection to be confirmed.
- [ ] Confirm `ads.txt` is reported as **Authorized**.
- [ ] Keep Auto Ads disabled.
- [ ] In **Privacy & messaging**, configure a Google-certified CMP for the EEA, UK, and Switzerland.
- [ ] Use the three-choice consent message that includes **Consent**, **Do not consent**, and **Manage options**.
- [ ] Check that there are no placeholders, under-construction pages, broken links, or console errors.
- [ ] Request review only after the deployed site passes all checks above.

## 3. Search indexing

- [ ] Submit `/sitemap.xml` in Google Search Console.
- [ ] Inspect and request indexing for the home page, three calculator pages, guides index, six guide pages, methodology, and contact pages.
- [ ] Recheck canonical URLs, crawlability, and indexing status after deployment.

## 4. Enable ads only after the site status is Ready

- [ ] Create one responsive manual unit for the home page, one for calculator pages, and one for guide articles.
- [ ] Set the three slot environment variables with those unit IDs.
- [ ] Set `NEXT_PUBLIC_ADSENSE_ENABLED=true` and redeploy.
- [ ] Confirm the AdSense script loads exactly once only after a valid home dataset, on each calculator, and on each of the six individual guide pages.
- [ ] Confirm `/guides`, `/about`, `/methodology`, `/contact`, `/privacy`, and `/terms` never load the AdSense script or render an ad slot.
- [ ] Confirm an empty home result, 404, error, and loading states never load the script, render `<ins class="adsbygoogle">`, or reserve an empty advertisement container.
- [ ] Confirm each eligible page has no more than one responsive unit, labelled `Advertisement`.
- [ ] Confirm ads are not adjacent to maps, 3D controls, search, date inputs, result cards, or other interactive controls.
- [ ] Repeat desktop/mobile console, overflow, CLS, and policy checks.

## 5. Monitoring and rollback

- [ ] Monitor the AdSense Policy Center, `ads.txt` status, browser console, CLS, and placement quality after launch.
- [ ] If a policy, rendering, or layout issue appears, set `NEXT_PUBLIC_ADSENSE_ENABLED=false` and redeploy to disable the script and every slot site-wide.
