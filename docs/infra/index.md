# Infra

GitHub Actions for this repo. Not game rules. `.github/workflows/push.yml`.

Site: `https://rontap.github.io/gardena/`. Pages source must be **GitHub Actions**.

## Push

Every push: `npm test` and `npm run e2e` in parallel. Chromium only for e2e.

Default branch, both green:

- Vite `dist/` → GitHub Pages. `--base` from `configure-pages` `base_path` (`/gardena` here).
- HEAD subject `N.N.N…` → tag `N.N.N` + GitHub Release. Existing release: no-op. Subject not `N.N.N`: no-op.

`package.json` `version`, wordmark, `SAVE_VERSION`, `PROTOCOL` are not this workflow.

Stale runs on non-default branches cancel. Pages deploys do not cancel in-flight.
