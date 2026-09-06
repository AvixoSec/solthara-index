# Solthara Index — VECTOR

A static architecture catalog with 101 model records, 15 milestones, full dossiers and explicit uncertainty. This is a repository snapshot, not a live leaderboard.

## Open

- `index.html`: keep `all-configs.js` and `assets/` beside it, or serve the repository with a static HTTP server.
- `Solthara-VECTOR-v2.html`: standalone edition with embedded data, JavaScript and CSS. External architecture images still need a network; unavailable images show labeled configuration maps.
- `all-configs.json`: canonical dataset. JS and YAML exports are generated from it.

The interface includes a registry, gallery, 19-column matrix, timeline, theory library, three-model comparison and eight tabs per dossier. JSON downloads retain complete records and raw configurations.

## Development

Node.js 20+ is required; CI uses Node.js 22. React and esbuild are build dependencies, not runtime CDN requirements.

```sh
npm ci --ignore-scripts
npm test
npm run validate
npm run build
npm run validate
npm run audit:data
```

The build validates data before replacing artifacts and writes `audit/current-integrity.json`. It does not silently rewrite the canonical JSON. The generated `audit/data-audit.json` reports review candidates, not scientific certification.

CI additionally installs isolated Playwright 1.55.0, runs `scripts/browser-smoke.mjs`, and uploads browser reports/screenshots. It visits every real model's eight tabs and checks filters, sorting, pagination, exports, comparison, timeline, theory categories, mobile navigation and the actual standalone page. External requests are blocked for deterministic fallback testing.

## Corrections and evidence

See [RESEARCH-AUDIT.md](RESEARCH-AUDIT.md). Revision `2026-09-06.1` separates primary-source-backed corrections from mechanical projections of explicit raw language-config values. Field-level `_solthara_audit` metadata preserves before/after values and sources. Unknowns stay unknown; original raw configurations and training assertions are preserved.

**Passing tests do not independently verify every scientific claim in the catalog.** Current repair results are in `audit/verification.json`; output hashes are in `audit/current-integrity.json`. Historical QA reports are retained under `audit/legacy/` and are not current passing evidence. No production speedup or lazy-loaded dataset is claimed.

## License and credits

Apache-2.0. Preserve `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md` and `licenses/`. Third-party figures retain their own licenses.

References: [Raschka's gallery](https://github.com/rasbt/llm-architecture-gallery), [YichenZW's table](https://github.com/YichenZW/llm-arch-table), [Awesome-LM-Architecture](https://github.com/Superposition09m/Awesome-LM-Architecture).
