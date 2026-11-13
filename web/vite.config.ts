import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

const localConfigPath = fileURLToPath(new URL('./config/local.js', import.meta.url));

// Dev-only: serves the gitignored web/config/local.js (default export = SUPPLEMENTARY_CONFIG keys such as
// SDAPI_HOSTNAME / SDSTORE_HOSTNAME) as /assets/supplementary_config.js. Without the file, the public stub is used.
function localSupplementaryConfig(): Plugin {
  return {
    name: 'sd-local-supplementary-config',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/assets/supplementary_config.js', async (_req, res, next) => {
        if (!existsSync(localConfigPath)) return next();

        try {
          const mod = await import(`${pathToFileURL(localConfigPath).href}?t=${Date.now()}`);

          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-store');
          res.end(`window.SUPPLEMENTARY_CONFIG = ${JSON.stringify(mod.default ?? {})};`);
        } catch (err) {
          next(err);
        }
      });
    }
  };
}

// `npm run dev:ssl`: serve https on :443 with the self-signed certs from ../ssl so the UI can be opened on a
// hostname mapped to 127.0.0.1 in /etc/hosts (Vite skips its Host header check when https is on).
function sslServer() {
  const key = fileURLToPath(new URL('../ssl/server.key', import.meta.url));
  const cert = fileURLToPath(new URL('../ssl/server.crt', import.meta.url));

  if (!existsSync(key) || !existsSync(cert)) {
    throw new Error('dev:ssl needs ssl/server.key and ssl/server.crt at the repo root; see "Running against a real API" in web/README.md');
  }

  return {
    https: { key: readFileSync(key), cert: readFileSync(cert) },
    host: '0.0.0.0',
    port: 443,
    strictPort: true
  };
}

// E2E_CSP=1 makes `vite preview` send the production policy that nginx.conf builds
// (connect-src points at the e2e mock hosts), so csp.spec.ts can run against a built bundle.
const previewCsp = [
  "default-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' http://localhost:8080 http://localhost:8081",
  "frame-src 'self' http://localhost:8080 http://localhost:8081",
  "font-src 'self'",
  "img-src 'self' https: data:",
  "media-src 'self'",
  "manifest-src 'self'",
  'worker-src blob:',
  "script-src 'self'"
].join('; ');

const server = process.env.SD_DEV_SSL ? sslServer() : {};

export default defineConfig({
  // Absolute /assets/... URLs in index.html and CSS: nginx rewrites "/assets"
  // to "$ROOT_URL/assets" in text/html and text/css only. JS chunk imports
  // are relative, and runtime URLs must be built from config.rootURL.
  base: '/',
  // Chunk preloads (the CSS and modulepreload links of lazy routes) are built in JS as "/" + file,
  // which nginx does not rewrite: prefix them with ROOT_URL at runtime, like assetUrl().
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType !== 'js') return undefined;

      return {
        runtime: `(function(p){var r=String((window.SUPPLEMENTARY_CONFIG||{}).ROOT_URL||'').replace(/\\/+$/,'');return r+'/'+p})(${JSON.stringify(filename)})`
      };
    }
  },
  plugins: [react(), localSupplementaryConfig()],
  server,
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rolldownOptions: {
      output: {
        // Vendor libraries get their own long-cached chunks. A group only ends up in
        // the entry's static imports if the entry itself imports it, so editor
        // (CodeMirror) and graph (React Flow, ELK) code stays on the lazy routes.
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/, priority: 40 },
            { name: 'vendor-bootstrap', test: /node_modules[\\/](react-bootstrap|@restart|@popperjs|bootstrap|dom-helpers|uncontrollable)[\\/]/, priority: 30 },
            { name: 'vendor-codemirror', test: /node_modules[\\/](@codemirror|@lezer|codemirror|crelt|style-mod|w3c-keyname|@marijn)[\\/]/, priority: 30 },
            { name: 'vendor-react-flow', test: /node_modules[\\/](@xyflow|d3-[a-z-]+|classcat)[\\/]/, priority: 30 },
            { name: 'vendor-tanstack', test: /node_modules[\\/]@tanstack[\\/]/, priority: 20 }
          ]
        }
      }
    }
  },
  preview: process.env.E2E_CSP ? { headers: { 'Content-Security-Policy': previewCsp } } : {},
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Every test starts clean: stubbed globals and env vars are undone and vi.spyOn spies restored.
    unstubGlobals: true,
    unstubEnvs: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/test/**', 'src/main.tsx']
    }
  }
});
