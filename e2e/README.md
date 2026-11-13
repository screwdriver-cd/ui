# e2e

Playwright specs for the React UI (`web/`). The shared specs also run against the legacy Ember
app (see "Ember support"). The API is mocked: `support/mocks` holds the data and default routes,
and `support/app.ts` wires them into every test.

## Running against React

```sh
cd web && npm run build
E2E_CSP=1 npx vite preview --port 5203 --strictPort      # E2E_CSP=1 sends the nginx-style CSP header
cd ../e2e && npx playwright test                         # E2E_BASE_URL defaults to http://localhost:5203
```

`specs/csp.spec.ts` visits each page and fails on any CSP violation. Run it with
`E2E_ENFORCE_CSP=1` against the preview above. Note: nginx.conf sets `worker-src blob:` only; the
ELK layout worker is served from `'self'`. The spec passed, but if a deployed build ever logs a
worker violation, add `'self'` to `worker-src` in nginx.conf.

## Running against Ember

```sh
cd .. && ./node_modules/.bin/ember serve --output-path <scratch>   # Node 22, port 4200
cd e2e && npm run test:ember
```

`npm run test:ember` sets `E2E_FRAMEWORK=ember` and points at port 4200; for another port run
`E2E_FRAMEWORK=ember E2E_BASE_URL=http://localhost:<port> npx playwright test`.

## Graph specs

`specs/graph-perf.spec.ts` (layout time budgets, layout off the main thread) and
`specs/graph-visual.spec.ts` (screenshots and rendering checks) drive the workflow graph's bench
page on a vite dev server at 127.0.0.1:5201, started for you if nothing answers there
(`E2E_GRAPH_URL` points them at another one). They are opt-in:

```sh
npm run test:graph             # E2E_GRAPH=1; the screenshots inside also need E2E_VISUAL=1
```

## Visual regression

Opt-in (`E2E_VISUAL=1`) because baselines depend on the platform and its fonts.

- `specs/visual.spec.ts`: seven screens (login, dashboard, search, validator, user settings,
  templates list, jobs page) in `en`, `ja` and `en-XA` (`?locale=en-XA`), at 1280x720, with a
  fixed clock (2024-03-15T12:00Z, UTC) and fixtures. A second suite checks ja and en-XA for
  horizontal overflow at 1280 and 1024 wide.
- `specs/graph-visual.spec.ts`: ten graph fixtures in `en` and `ja`.

```sh
npm run test:visual            # compare both
npm run test:visual:update     # regenerate baselines, then review the png diff in git
```

Baselines live in `snapshots/` as `<name>-<project>-<platform>.png`, with
41 each for `darwin` and `linux` (21 screens from `visual.spec.ts`, 20 from `graph-visual.spec.ts`). Run them
against a built preview (port 5203 locally), never the dev server.

Linux baselines come from the Playwright image, with container-only `node_modules` so the host's
are left alone:

```sh
docker run --rm --ipc=host -v "$PWD/..:/repo" \
  -v sdui-web-nm:/repo/web/node_modules -v sdui-e2e-nm:/repo/e2e/node_modules \
  mcr.microsoft.com/playwright:v1.64.1-noble bash -c '
    cd /repo/web && npm ci && npx vite build --outDir /tmp/dist --emptyOutDir &&
    (npx vite preview --outDir /tmp/dist --host 127.0.0.1 --port 4173 --strictPort &) &&
    (npx vite --host 127.0.0.1 --port 5201 --strictPort &) &&
    cd /repo/e2e && npm ci &&
    npx wait-on -t 180000 http://127.0.0.1:4173 http://127.0.0.1:5201/src/features/workflow-graph/bench/index.html &&
    E2E_VISUAL=1 E2E_GRAPH=1 E2E_GRAPH_URL=http://127.0.0.1:5201 E2E_BASE_URL=http://127.0.0.1:4173 \
      npx playwright test specs/graph-visual.spec.ts specs/visual.spec.ts --update-snapshots'
```

## Ember support

Everything Ember-specific lives in `support/ember.ts`; specs never check the framework.

- Tests the Ember app cannot pass (rewrite features and requirements such as no page scroll,
  i18n, the event rail window, the graph, CSP, visual baselines) are tagged `REACT_ONLY`, with a
  `// React only: ...` comment where the reason is not obvious. An Ember run leaves them out
  (`grepInvert` in `playwright.config.ts`).
- Tests of Ember's own behaviour are tagged `EMBER_ONLY` and live in `specs/ember-only.spec.ts`;
  a React run leaves them out.
- Where only the markup differs, the page objects in `support/pages` (`header.ts`, `ui.ts`) take
  Ember's selectors from `support/ember.ts`, and the spec is shared.

Today an Ember run has 59 tests (58 shared, 1 Ember-only) and a React run 231.

To retire Ember: delete `support/ember.ts` and `specs/ember-only.spec.ts`, drop the `REACT_ONLY`
tags and imports and the `grepInvert`, keep the React side of each page object, and remove
`test:ember` from `package.json`.
