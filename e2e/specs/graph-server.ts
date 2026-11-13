import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * The graph specs drive the dev-only bench page of the workflow-graph feature
 * (web/src/features/workflow-graph/bench). They do not depend on the Ember
 * or app server: this starts `npx vite --host 127.0.0.1 --port 5201 --strictPort` in ../web if
 * nothing answers on that port yet, and leaves it running for the next run
 * (stop it with `pkill -f "vite --port 5201"`). Set E2E_GRAPH_URL to use a
 * server you started yourself.
 *
 * They are opt-in (`E2E_GRAPH=1`, or `npm run test:graph`) so a plain run does not need that server.
 */
export const GRAPH = process.env.E2E_GRAPH === '1';
export const GRAPH_PORT = 5201;
export const GRAPH_URL = process.env.E2E_GRAPH_URL ?? `http://127.0.0.1:${GRAPH_PORT}`;
const BENCH = '/src/features/workflow-graph/bench/index.html';

export const benchUrl = (fixture: string, locale: 'en' | 'ja' = 'en') => `${GRAPH_URL}${BENCH}?fixture=${fixture}&locale=${locale}`;

async function up(): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH_URL}${BENCH}`);

    return res.ok;
  } catch {
    return false;
  }
}

export async function ensureGraphServer(timeoutMs = 90_000): Promise<void> {
  if (await up()) return;

  if (!process.env.E2E_GRAPH_URL) {
    const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(GRAPH_PORT), '--strictPort'], {
      cwd: resolve(__dirname, '../../web'),
      detached: true,
      stdio: 'ignore',
      env: { ...process.env }
    });

    // Another worker may have won the port race: strictPort then exits and we just wait for the winner.
    child.on('error', () => {});
    child.unref();
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await up()) return;
    await new Promise(r => setTimeout(r, 300));
  }

  throw new Error(`graph bench server did not start on ${GRAPH_URL}`);
}
