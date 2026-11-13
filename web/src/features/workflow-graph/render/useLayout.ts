import { useEffect, useMemo, useState } from 'react';
import { computeLayout } from '../layout/client';
import { layoutKey } from '../layout/input';
import type { LayoutInput, LayoutResult } from '../layout/types';

/**
 * Async layout keyed on structure + collapsed state. While a new layout is
 * computing the previous result stays on screen, so nothing flickers.
 */
export function useLayout(input: LayoutInput): {
  layout: LayoutResult | null;
  error: Error | null;
} {
  const key = useMemo(() => layoutKey(input), [input]);
  const [state, setState] = useState<{
    layout: LayoutResult | null;
    error: Error | null;
  }>({ layout: null, error: null });

  useEffect(() => {
    let cancelled = false;

    computeLayout(input)
      .then(layout => {
        if (!cancelled) setState({ layout, error: null });
      })
      .catch(error => {
        if (!cancelled) setState(s => ({ ...s, error: error as Error }));
      });

    return () => {
      cancelled = true;
    };
    // `key` fully determines the layout; `input` identity changes on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
