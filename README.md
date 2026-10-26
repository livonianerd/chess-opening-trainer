# Chess Opening Trainer

[Open the live trainer](https://livonianerd.github.io/chess-opening-trainer/)

A lightweight, responsive opening trainer built with vanilla JavaScript, Vite and chess.js. Ten local, deterministic opening lines; no engine, accounts, backend or runtime API. All assets and rules are bundled locally.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173).

```sh
npm test                 # Rules, opening legality and trainer behavior
npx playwright install chromium
npm run test:e2e         # Real browser: every line, controls and mobile layout
npm run build           # Production output in dist/
npm run preview         # Serve the production build
```

## How to play

Choose an opening and Learn or Practice. White or Black is assigned automatically; the board faces your side. Click a piece, then a highlighted destination. The opponent immediately replies with its next scripted move. A legal move outside the chosen line leaves the board unchanged and counts as a mistake.

Learn shows the next move and its purpose. Use **Next step** beneath the board to play that move and the scripted reply, or **Previous step** to return to the last decision. You can also play the move yourself on the board. Practice hides it until Hint is pressed. The final score is correct moves divided by correct moves plus mistakes. Hints are counted separately, without a score penalty. Undo takes back your last move and the opponent’s reply; it preserves mistakes and hints. Restart, switching modes, and choosing an opening reset the session. Black always starts after the scripted White move. Promotion presents a choice of all four pieces when applicable.

Progress counts plies (individual moves by either side). Completed lines show a completion message. The trainer intentionally stops at the end of each line.

## GitHub Pages deployment

1. Create a GitHub repository and push these files to its `main` branch, including `package-lock.json`.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. The included `.github/workflows/deploy.yml` tests the trainer and browser interactions, builds the site, and deploys `dist/` whenever `main` is pushed. You can also run it manually from the Actions tab.
4. Open the deployment URL shown by the workflow, typically `https://USERNAME.github.io/REPOSITORY/`.

Vite uses `base: './'`, so generated JavaScript and CSS load at repository subpaths, root domains, and custom domains without changing the configuration. No routing fallback or server configuration is needed.

## Project structure

- `src/openings.js`: ten curated main variations, side assignments, strategies and per-ply explanations.
- `src/trainer.js`: independently testable session state, validation, scripted opponent, score, undo and restart.
- `src/main.js`: accessible click-to-move board, orientation, promotion chooser and lesson UI.
- `src/style.css`: responsive green-and-cream visual design; local system fonts.
- `tests/trainer.test.js`: data legality and trainer/rules tests.
- `tests/browser/app.spec.js`: browser interaction and mobile tests.
- `.github/workflows/deploy.yml`: test, build and Pages deployment.

To add an opening, add a definition with one or more `variations`. Each variation contains a SAN `moves` array and a matching `explanations` array. The initial UI uses the first variation. Run `npm test` to verify legality and metadata. Lines are representative teaching choices, not exhaustive opening theory.

Rules API: [chess.js documentation](https://github.com/jhlywa/chess.js). Deployment follows [Vite’s static deployment guidance](https://vite.dev/guide/static-deploy).

## Dependency audit

The implementation-time audit reported two high-severity advisories in development tooling (`vite` and transitive `source-map-js`). A patched-version installation could not be resolved by the available registry/npm environment. These packages are not shipped as runtime dependencies in `dist/`; update the development dependencies and rerun the checks when patched packages are available.
