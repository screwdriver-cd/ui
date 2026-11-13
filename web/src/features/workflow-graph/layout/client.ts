import { layoutKey } from './input';
import type { LayoutInput, LayoutResult } from './types';
import type { ELK } from 'elkjs/lib/elk-api';

const CACHE_SIZE = 16;
const cache = new Map<string, Promise<LayoutResult>>();

let elkPromise: Promise<ELK> | null = null;

/**
 * ELK runs in a Web Worker where one exists. The worker is elkjs's own worker
 * script (inlined as a blob: URL because the production CSP only allows
 * `worker-src blob:`), driven through elk-api; only the cheap post-processing
 * stays on the calling thread. Without Workers (jsdom, old browsers) the
 * bundled single-thread build is used.
 */
function getElk(): Promise<ELK> {
  if (!elkPromise) {
    elkPromise = (async () => {
      if (typeof Worker !== 'undefined') {
        try {
          const [{ default: Api }, { default: ElkWorker }] = await Promise.all([
            import('elkjs/lib/elk-api'),
            import('./elk.worker?worker&inline')
          ]);

          return new Api({ workerFactory: () => new ElkWorker() }) as ELK;
        } catch {
          // fall through to the bundled build
        }
      }

      const { default: Bundled } = await import('elkjs/lib/elk.bundled.js');

      return new Bundled() as ELK;
    })();
  }

  return elkPromise;
}

async function layoutWith(
  input: LayoutInput,
  key: string
): Promise<LayoutResult> {
  const { runLayout } = await import('./elk');

  try {
    return await runLayout(input, key, await getElk());
  } catch (e) {
    // A worker that failed to start: retry once on the main thread.
    const { default: Bundled } = await import('elkjs/lib/elk.bundled.js');

    elkPromise = Promise.resolve(new Bundled() as ELK);
    if (typeof Worker === 'undefined') throw e;

    return runLayout(input, key, await elkPromise);
  }
}

/**
 * Computes the layout in a Web Worker (falls back to the main thread where
 * Workers are unavailable, such as jsdom). Results are cached by
 * `layoutKey(input)`, so status-only updates return the identical result.
 */
export function computeLayout(input: LayoutInput): Promise<LayoutResult> {
  const key = layoutKey(input);
  const hit = cache.get(key);

  if (hit) {
    cache.delete(key);
    cache.set(key, hit);

    return hit;
  }

  const promise: Promise<LayoutResult> = layoutWith(input, key);

  cache.set(key, promise);
  promise.catch(() => cache.delete(key));

  while (cache.size > CACHE_SIZE) {
    cache.delete(cache.keys().next().value as string);
  }

  return promise;
}

export const clearLayoutCache = () => cache.clear();
