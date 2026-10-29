# Languages and start-over QA — 2026-10-29

- 1249 English catalogue entries. Runtime literals/templates and HTML text covered, placeholders valid. English data smoke test covers clients, device configs, memories, letters, diagnostics, story shelf and furnishings. IDs remain unchanged.
- `npm test`: 53/53. Covers default English, invalid/blocked preference storage, interpolation, English data, save replacement, language/auth preservation and failed reset writes.
- Browser QA used isolated origin 127.0.0.1:4182 and disposable fixture progress. The user's game origin was not reset.
- 320×568: menu with album and all utility buttons fits. Buttons remain at least 44px tall. Screenshot: menu-english.png.
- English → Russian → English: current work, 1000 coins and album survive. Language dialog indicates the active choice. Screenshot: menu-languages.png.
- Start over: cancel keeps the current order and 1000 coins. Confirmation returns to 0 coins, 0 stories, first pager contract and Uncle Lev's letter; Russian preference survives. Screenshot: menu-restart-confirm.png.
- Accepted a new pager order in English. Svetlana's intro, questions, device labels and tools display in English.
- English VCR repair: loading belt exposes route mechanic; points 1–2–3 complete it and advance progress to 1/2. No captured browser errors.
- Native Android launcher resources: English default, Russian override. No physical Android device test. iOS not compiled.

Android debug APK built successfully (82.5 MB). All root runtime JS/CSS/HTML files in the APK match source SHA-256.
