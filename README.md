# GondolatHid

Mobile-friendly predictive keyboard web app (Hungarian and Romanian): a caregiver taps letters and words to compose text for someone who cannot type. Word suggestions on top; **Predictive** (dynamic letter order) or **QWERTY** (fixed layout) at the bottom.

## Prerequisites

- Node.js 20+

## Setup and run

```bash
npm install
npm run build:words
npm run dev
```

Open the localhost URL from the terminal on a phone or emulator.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run build:words` | Generates `public/data/hu/` and `public/data/ro/` (stats, bootstrap, supplement) |
| `npm run preview` | Preview production build |

## Dictionary data

See [NOTICE.md](./NOTICE.md).

Personal / shared words (names, `bojler`, `gázkazán`, …) live in [`public/data/extra-words.txt`](./public/data/extra-words.txt) (one line per word, all languages). Edit this file and redeploy; `npm run build:words` also merges them into each language supplement.

## Usage

1. **Predictive:** letters are ordered by corpus frequency / next-letter likelihood; up to five suggested words above the keyboard.
2. **QWERTY:** fixed layout; only suggestions and composed text change.
3. **Space** accepts the current prefix as a word; **⌫** deletes; **↵** inserts a new line.

Language toggle: **Magyar** / **Română** (reloads dictionary data).

## Deploy (GitHub Pages)

Pushing to `main` runs [GitHub Actions](.github/workflows/pages.yml) to build and publish the site.

1. GitHub → repo **Settings → Pages** → **Build and deployment** → Source: **GitHub Actions** (not “Deploy from a branch”). Until this is set, the deploy job fails and the site returns **404**.
2. **Actions** → open the latest **Deploy GitHub Pages** run → **Re-run all jobs** (after step 1).
3. Public URL: **https://danieljanosrobert.github.io/gondolathid/** (trailing slash is fine).

If deploy still fails: **Settings → Actions → General → Workflow permissions** → **Read and write permissions**.

Dictionary files are generated in CI (`npm run build:words`); large `public/data/*` trees are not committed.

## License

- **Application code:** [MIT](./LICENSE)
- **Word frequency (FrequencyWords):** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — details in [NOTICE.md](./NOTICE.md)
- **Hunspell supplement:** LibreOffice dictionaries — see [NOTICE.md](./NOTICE.md)
