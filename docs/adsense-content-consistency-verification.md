# AdSense content consistency verification

Branch: `codex/adsense-content-consistency`
Implementation and local verification: 6 September 2026

## Implemented

- Front-light instructions now put the photographer on the Sun-facing side of the subject, consistent with the diagrams.
- Home daylight summaries use the same event label as the overview. Golden-hour summaries use unrounded elapsed event instants and round only for presentation; missing windows are unavailable, not zero. Special daylight notes remain visible.
- Fixed seasonal examples and quick buttons identify reference dates rather than exact local solstice/equinox dates. Inputs, numerical datasets, filenames and CSV column order remain unchanged. Independently sourced benchmark dates remain intact.
- Home, affected calculators, About and Methodology sitemap dates reflect substantive changes. About and Methodology share date definitions with the sitemap; guide metadata continues to use each guide's modifiedDate. The unchanged NREL worked-example date remains 24 August 2026.

## Verification evidence

- `npm test`: 359 tests passed across 33 files.
- `npm run typecheck`: passed.
- `npm run lint`: no errors; five pre-existing unused-variable warnings remain.
- `npm run build`: passed; 26 static/generated routes.
- Chromium: 30 tests passed across adsense-content-consistency, adsense-readiness and adsense-home-experience suites. Windows test-server teardown required terminating only the verified test-owned server processes after workers had exited; the runner then returned exit 0.
- Chromium: two targeted date-reference tests passed.
- New duration tests cover short windows missed by hourly samples, midnight, spring/fall DST transitions, rounding to the next hour, missing/reversed boundaries, polar conditions and special daylight notes.
- Desktop and 390px tests verify result updates, matching daylight summaries, event windows, CSV download, reference labels and no horizontal page overflow. Direct browser inspection also confirmed the mobile duration card is readable.
- All six built guide tables were compared with the existing production tables: numerical values unchanged.
- `git diff --check`: passed.

## Release status

Implementation and local verification complete. The user explicitly chose to deploy independently. Changes remain uncommitted on the implementation branch; nothing was pushed and no AdSense review was submitted.

During optional release checks, Vercel CLI reported an invalid token and the connected connector could not access the linked solar-path project. No project configuration was changed. This does not block delivery of the user-managed deployment handoff.

User deployment checklist: verify all 16 production sitemap pages, account-verification meta, absence of ad scripts/slots, corrected guidance, reference labels, matching update dates, address/date interactions and CSV. Inspect changed URLs in Search Console afterward. These production and account checks were not performed for this implementation. Indexing evidence is separate from AdSense approval; the user submits the AdSense review.
