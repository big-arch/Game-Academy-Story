# Languages and restarting

English is the default for players without a saved language choice. The menu offers English and Русский. Selection is stored under `workshop-stories-language`; changing language saves progress and reloads. Failed preference writes show an error instead. The existing game save key and object/client identifiers stay unchanged.

## Text authoring

`i18n.js` provides `t('Russian source text')` and tagged templates. Add the English translation to `locale-en.js`, with interpolation positions written as `{{0}}`, `{{1}}`, etc. Russian source text is the stable lookup key. Keep complete sentences together, rather than translating individual words. The catalogue covers UI, client dialogue, stories, discoveries, follow-up letters and accessibility labels.

`boot.js` translates static HTML and accessibility attributes before importing the game. Data modules translate when loaded. Therefore language changes reload the app; they never change saved identifiers. No online translation service is used.

Run `npm run audit:locales` after text changes. It checks missing keys, untranslated runtime literals/templates, Cyrillic leaks into English and placeholder consistency. `npm test` verifies English data in a separate process and existing Russian rules. Node model tests use Russian by default; `WORKSHOP_LANGUAGE=en` selects English in a separate Node process.

## Start over

The menu and old reset control share a confirmation dialog. Keep playing is focused by default. Confirmation replaces only game progress with `initialState()`. Language, authentication and unrelated storage remain intact. Failed writes leave the active game available. The usual best-effort cloud save receives the fresh state; no account deletion or sign-out occurs.

The Android launcher title defaults to Workshop Stories, with a Russian resource override. The base iOS display title is Workshop Stories; iOS has not been compiled on this Windows machine.
