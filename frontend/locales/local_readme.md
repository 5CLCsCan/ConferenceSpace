# Localisation Workflow

- Primary locale lives in `en.json`. Treat it as the source of truth for keys, structure, and copy updates.
- Keep `vi.json` (and any new locale file) in UTF-8, mirroring the exact nested shape of `en.json`. Do not rename keys.
- When adding text, update `en.json` first, then duplicate the key path in every other locale file with the translated string.
- Use human-readable placeholder names (e.g. `{name}`) and ensure all locales include the same placeholders.
- Avoid committing partially translated keys; if a translation is pending, copy the English text and leave a `TODO` comment in the PR to follow up.
- Run a quick sanity check locally: clear `localStorage.conference_locale`, reload, and toggle via `LanguageSwitcher` to confirm both languages render correctly.
- PRs touching localisation should note which files were updated and whether strings were machine-translated, awaiting review, or verified by a native speaker.
