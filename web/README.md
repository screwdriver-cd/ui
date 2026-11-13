# Screwdriver UI (React)

Vite + React 19 + TypeScript. Run everything under Node 22 (`fnm exec --using=22 -- …`).

```
npm run dev        # vite on http://localhost:5173 (fails if the port is taken)
npm run dev:ssl    # vite on https://0.0.0.0:443, see "Running against a real API"
npm run typecheck
npm test           # vitest + coverage/lcov.info
npm run build      # tsc + vite build -> dist/
```

## Running against a real API
By default the app talks to `http://localhost:8080` (API) and `http://localhost:8081` (store). To point it somewhere else, create the gitignored `web/config/local.js` (dev server only; builds and tests ignore it). Its default export becomes `window.SUPPLEMENTARY_CONFIG`; edit it and reload the page to apply.

```js
export default {
  SDAPI_HOSTNAME: 'https://api.screwdriver.cd',
  SDSTORE_HOSTNAME: 'https://store.screwdriver.cd'
  // SDAPI_HOSTNAME: 'http://localhost:9001',
  // SDSTORE_HOSTNAME: 'http://localhost:9002'
};
```

Login is a credentialed cross-origin call, so the API must allow the UI's origin (CORS, cookies). A plain `npm run dev` on `http://localhost:5173` only works against an API that allows that origin (e.g. a local API). For a hosted API that only allows its own UI hostname, serve the UI over https on that hostname:

1. Create a local CA and a server certificate signed by it, in `ssl/` at the repo root (gitignored; the server cert is valid 365 days, so rerun the last two `openssl` commands when it expires). Set `HOST` to the hostname the API allows:
   ```
   mkdir -p ssl && cd ssl
   HOST=cd.screwdriver.cd
   openssl req -x509 -nodes -newkey rsa:4096 -days 1095 -keyout ca.key -out ca.crt -subj "/CN=Screwdriver Local Dev CA" \
     -addext "basicConstraints=critical,CA:TRUE,pathlen:0" -addext "keyUsage=critical,keyCertSign,cRLSign"
   openssl req -nodes -newkey rsa:2048 -keyout server.key -out server.csr -subj "/CN=$HOST"
   printf "subjectAltName=DNS:$HOST\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n" > server.ext
   openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 365 -extfile server.ext
   ```
   Keep `ca.key` private: anything it signs is trusted by your browser.
2. Trust `ssl/ca.crt` once. On macOS: `security add-trusted-cert -r trustRoot -k ~/Library/Keychains/login.keychain-db ssl/ca.crt`. Firefox: either set `security.enterprise_roots.enabled` to `true` in `about:config` and restart, or import `ca.crt` under Settings, Privacy & Security, View Certificates, Authorities (tick "Trust this CA to identify websites"). Trust the CA rather than clicking through a warning: if the real site sends HSTS for that hostname, browsers refuse any exception, and the server cert must not be a CA itself (`CA_CERT_USED_AS_END_ENTITY`).
3. Map the hostname to 127.0.0.1 in `/etc/hosts` (e.g. `127.0.0.1 cd.screwdriver.cd`). This hides the real site until you remove the line.
4. `npm run dev:ssl`, then open `https://<that hostname>`.

Binding :443 may need elevated rights on some systems; if it fails, run Vite with `sudo -E "$(command -v node)" node_modules/vite/bin/vite.js` with `SD_DEV_SSL=1` set.

## Conventions
- **One directory per feature**: `src/features/<feature>/` with `routes.tsx` (exports `createRoutes(authenticated)`), `locales/{en,ja}.json`, components, hooks, tests. Never edit another feature's files. Shared code goes in `src/components`, `src/api`, `src/i18n`, and only add to it, never change existing behaviour without running the whole suite.
- **Routes** are registered centrally in `src/app/router.tsx`; features only fill in their own `createRoutes`. Paths match the current v2 Ember URLs exactly.
- **API**: `import { api } from '~/api/client'`; `api.get<T>(path, { query })`. Server state goes through TanStack Query; polling uses `config.buildReloadTimer / eventReloadTimer / logReloadTimer`.
- **No raw UI strings**: `const t = useT(); t('feature.key', { name })`. Add the key to both `locales/en.json` and `locales/ja.json` of your feature (ICU messages, ids prefixed with the feature name). The i18n test fails on missing ja keys and unknown ids.
- **No page-level vertical scroll**: wrap screens in `<PageLayout header={…}>` and use `<ScrollRegion>` for anything that scrolls. Never set overflow on html/body.
- **Tests**: Vitest + RTL with `renderWithProviders` (`src/test/render.tsx`). Playwright parity specs live in `../e2e/specs` and run against Ember (`E2E_BASE_URL=http://localhost:4200`) and React; write the spec against Ember first when feasible.
- Runtime config comes from `window.SUPPLEMENTARY_CONFIG` via `~/config/config` (never `import.meta.env`).
- Session is stored in the ember-simple-auth shape so existing logins survive the cutover.
