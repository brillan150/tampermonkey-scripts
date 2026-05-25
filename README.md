# Tampermonkey Userscripts

Tampermonkey userscripts for customizing and improving Perplexity.ai and other websites.

## What this repo is

- A **single source of truth** for my userscripts
- Each script is a standalone `.user.js` file
- Scripts are installed and auto-updated in Tampermonkey via their **raw GitHub URLs**

## Scripts

### Perplexity Citation Toggle for Speechify

Toggle Perplexity citation elements on and off to make text-to-speech (e.g. Speechify) read more cleanly.

- File: `perplexity-citation-toggle.user.js`
- Matches: `https://www.perplexity.ai/*`, `https://perplexity.ai/*`

## How I install/update scripts

1. Open the `.user.js` file on GitHub.
2. Click **Raw** to get the raw file URL.
3. Open that raw URL in my browser.
4. Tampermonkey shows an install or update prompt.

Tampermonkey’s **Userscript Update** setting is configured to check for updates (and install them automatically) on a regular interval. I bump the `@version` in the script header whenever I want to publish a new version.

## Development workflow

- Edit scripts locally in this repo.
- Keep each script in its own `.user.js` file.
- Bump the `@version` field whenever behavior changes.
- Commit and push to `main` when the version is ready to ship.

## License

See [LICENSE](./LICENSE) for details.
