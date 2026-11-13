import { lazy, Suspense, type ComponentType, type JSX } from 'react';

/**
 * Code-split a named component export: `lazyNamed(() => import('./x'), 'X')`.
 * Keeps heavy route trees (graph, editor, tables) out of the main chunk.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyNamed(load: () => Promise<Record<string, any>>, name: string): (props?: any) => JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Lazy = lazy(() => load().then(m => ({ default: m[name] as ComponentType<any> })));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function LazyRoute(props?: any) {
    return (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
