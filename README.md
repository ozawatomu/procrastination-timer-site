# Procrastination Timer website

Promotional site for the Procrastination Timer app, built with Astro, TypeScript and custom CSS. It generates static HTML for GitHub Pages at **https://ozawatomu.github.io/procrastination-timer-site/**. No visitor analytics, cookies, backend or accounts.

The home page carries a live HTML/CSS replica of the app's timer screen (`src/components/TimerReplica.astro`, `src/scripts/replica.ts`) that ports the app's timestamp-based state and second-aligned tick. Colours, type sizes and motion follow the app's theme files; the readout format is a port of `lib/timer/time_formatter.dart`.

## Local development

Use Node 24 LTS (Node 22.12+ works) and npm. Dependencies are pinned by `package-lock.json`.

```sh
npm ci
npm run dev
```

```sh
npm run check        # astro check (TypeScript)
npm run build        # writes dist/
npm run test:links   # validates dist/: canonical URLs, links, sitemap, robots, fonts
npm run serve        # serves dist/ like GitHub Pages on http://127.0.0.1:4180/procrastination-timer-site/
```

Do not commit `dist/`.

## Browser checks

```sh
npx playwright install chromium
npm test
```

Build first. The suite serves `dist/` with `scripts/serve.mjs` on port 4180 (Astro's own `preview` command detaches into a background daemon, which Playwright cannot supervise) and covers the replica (ticking, switching, pause, reset, hour rollover, theme toggle, keyboard), every page under axe (WCAG 2.1 AA), JavaScript-disabled content, reduced motion, responsive layouts from 360 px to 1440 px, landscape and 200 % text. `PLAYWRIGHT_CHANNEL=chrome npm test` uses an installed Google Chrome instead.

For a mobile Lighthouse check, keep `npm run serve` running and run:

```sh
npx lighthouse http://127.0.0.1:4180/procrastination-timer-site/ --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=/tmp/pt-lighthouse.html --chrome-flags="--headless"
```

Targets: performance ≥ 95, accessibility, best practices and SEO 100, LCP ≤ 2.0 s, CLS 0.

## Hosting switch

`site.config.mjs` is the only place that knows where the site lives. It feeds `astro.config.mjs` (`site` and `base`), `src/data/site.ts` (`href()` and `absolute()` prefix every internal URL), `scripts/check-build.mjs`, `playwright.config.ts` and the tests.

- **GitHub project page** (current): `origin: 'https://ozawatomu.github.io'`, `base: '/procrastination-timer-site'`, `domain: null`.
- **Custom domain**: `origin: 'https://<domain>'`, `base: ''`, `domain: '<domain>'`, plus a `public/CNAME` file containing the domain. Then add the DNS records and enable HTTPS under Settings → Pages. The github.io URLs redirect afterwards.

Under a project page, `robots.txt` is served from the repo path and is not authoritative for the host, so submit `sitemap-index.xml` in Google Search Console (URL-prefix property) instead of relying on it.

## Store links

`src/data/site.ts` holds the Play URL (derived from the package id `com.tomuozawa.procrastinationtimer`) and per-platform `available` flags. While a platform is unavailable, its button renders as a non-link "Coming soon" chip, the sticky mobile bar is not rendered and JSON-LD carries no `installUrl`. On release day:

1. Set `android.available: true` (and `ios.available: true` with the App Store URL once it exists).
2. Push `main`. The workflow validates and redeploys.

Play links carry `utm_source=ozawatomu.github.io`, `utm_medium=website` and a `utm_campaign` starting with `website_` in the `referrer` parameter. No personal identifier is included. The Apple badge stays unreferenced in `src/assets/` until the iOS listing is live, per Apple's badge guidelines.

## Assets

- `public/favicon.svg` draws the app's dial from the constants in the app's `tool/icon/launcher_icon_painter.dart`; `favicon.png` and `apple-touch-icon.png` are resized from `assets/icon/ios_light.png`.
- `src/assets/screens/light.png` and `dark.png` are real captures from the Pixel 8 (Android 15) emulator running the release build with a seeded timer state; Astro converts them to WebP at build.
- Fonts are Latin subsets of the app's Lato and Roboto TTFs (`uvx --from "fonttools[woff]" pyftsubset … --flavor=woff2 --layout-features="kern,liga,tnum,pnum,lnum"`), stored in `src/assets/fonts/` so Vite hashes and base-prefixes them. Licences are in `public/fonts/`.
- `public/og.png` is rendered from `scripts/og.html` with `npm run og` (Playwright Chromium). Regenerate it after changing the headline.

## Deployment

Every push to `main` runs **Validate and deploy Procrastination Timer** (`.github/workflows/deploy.yml`): install, type check, build, link check, browser tests, then upload `dist/` and deploy through the `github-pages` environment. Pull requests validate without deploying.

One-time setup in the repository: Settings → Pages → Build and deployment → Source: **GitHub Actions**.

URLs for the store consoles:

- Privacy policy: `https://ozawatomu.github.io/procrastination-timer-site/privacy/`
- Support: `https://ozawatomu.github.io/procrastination-timer-site/support/`
- Marketing: `https://ozawatomu.github.io/procrastination-timer-site/`

Play Console Data safety: no data collected or shared (Play Billing data is exempt). App Store privacy label: Data Not Collected. Keep the in-app privacy text (`Strings.privacyPolicyBody`) and `src/pages/privacy.astro` in step.
