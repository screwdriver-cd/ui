import { act, renderHook } from '@testing-library/react';
import { mockApi } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { useValidation } from './useValidation';
import type { ValidationResult } from './validate';

const DEBOUNCE_MS = 250;
const PIPELINE_A = 'jobs:\n  a:\n    image: node:20';
const PIPELINE_B = 'jobs:\n  b:\n    image: node:22';

/**
 * A fetch whose responses the test sends by hand, so requests can overlap and
 * finish out of order. Like the real fetch it rejects once its signal aborts.
 */
function deferredFetch() {
  const requests: Array<{
    path: string;
    yaml: string;
    signal: AbortSignal;
    respond: (body: ValidationResult) => Promise<void>;
  }> = [];

  vi.stubGlobal(
    'fetch',
    vi.fn(
      (input: RequestInfo | URL, init: RequestInit = {}) =>
        new Promise<Response>((resolve, reject) => {
          const signal = init.signal!;

          signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
          requests.push({
            path: new URL(String(input)).pathname,
            yaml: (JSON.parse(String(init.body)) as { yaml: string }).yaml,
            signal,
            respond: body =>
              act(async () => {
                resolve(new Response(JSON.stringify(body), { status: 200 }));
              })
          });
        })
    )
  );

  return requests;
}

const setup = (yaml: string) =>
  renderHook(({ yaml }) => useValidation(yaml), { initialProps: { yaml } });

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('useValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    signIn();
  });
  afterEach(() => {
    vi.useRealTimers();
    signOut();
  });

  it('does nothing for blank text', async () => {
    const { calls } = mockApi({});
    const { result } = setup('  \n\t ');

    await wait(DEBOUNCE_MS * 4);
    expect(calls).toHaveLength(0);
    expect(result.current).toEqual({ result: null, pending: false });
  });

  it('posts the yaml once it has been unchanged for 250ms and then settles', async () => {
    const { calls } = mockApi({
      'POST /validator': () => ({ errors: ['bad'] })
    });
    const { result } = setup(PIPELINE_A);

    expect(result.current).toEqual({ result: null, pending: true });

    await wait(DEBOUNCE_MS - 1);
    expect(calls).toHaveLength(0);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.body).toEqual({ yaml: PIPELINE_A });
    expect(result.current).toEqual({
      result: { errors: ['bad'] },
      pending: false
    });
  });

  it('only validates the latest text while the user keeps typing', async () => {
    const { calls } = mockApi({ 'POST /validator': () => ({}) });
    const { rerender } = setup('jobs:');

    await wait(200);
    rerender({ yaml: 'jobs:\n  a:' });
    await wait(200);
    rerender({ yaml: PIPELINE_A });
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(calls.map(c => c.body)).toEqual([{ yaml: PIPELINE_A }]);
  });

  it('turns API failures into an errors result instead of throwing', async () => {
    mockApi({
      'POST /validator': () => [500, { message: 'Internal Server Error' }]
    });
    const { result } = setup(PIPELINE_A);

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(result.current).toEqual({
      result: { errors: ['500 - Internal Server Error'] },
      pending: false
    });
  });

  it('keeps showing the last result, marked pending, while newer text is checked', async () => {
    const requests = deferredFetch();
    const { result, rerender } = setup(PIPELINE_A);

    await wait(DEBOUNCE_MS);
    await requests[0]!.respond({ errors: ['a is bad'] });
    expect(result.current).toEqual({
      result: { errors: ['a is bad'] },
      pending: false
    });

    rerender({ yaml: PIPELINE_B });
    expect(result.current).toEqual({
      result: { errors: ['a is bad'] },
      pending: true
    });

    await wait(DEBOUNCE_MS);
    await requests[1]!.respond({ errors: ['b is bad'] });
    expect(result.current).toEqual({
      result: { errors: ['b is bad'] },
      pending: false
    });
  });

  it('aborts the in-flight request when the text changes, so the latest request wins', async () => {
    const requests = deferredFetch();
    const { result, rerender } = setup(PIPELINE_A);

    await wait(DEBOUNCE_MS);
    expect(requests).toHaveLength(1);

    rerender({ yaml: PIPELINE_B });
    expect(requests[0]!.signal.aborted).toBe(true);

    await wait(DEBOUNCE_MS);
    expect(requests.map(r => r.yaml)).toEqual([PIPELINE_A, PIPELINE_B]);
    expect(requests[1]!.signal.aborted).toBe(false);

    // The aborted request's answer is dropped, even if it would arrive last.
    await requests[1]!.respond({ errors: ['b'] });
    await requests[0]!.respond({ errors: ['a'] });
    expect(result.current).toEqual({
      result: { errors: ['b'] },
      pending: false
    });
  });

  it('is not pending when the text goes back to what was last validated', async () => {
    const requests = deferredFetch();
    const { result, rerender } = setup(PIPELINE_A);

    await wait(DEBOUNCE_MS);
    await requests[0]!.respond({ errors: ['a'] });

    rerender({ yaml: PIPELINE_B });
    expect(result.current.pending).toBe(true);

    rerender({ yaml: PIPELINE_A });
    expect(result.current).toEqual({
      result: { errors: ['a'] },
      pending: false
    });
  });

  it('clears the result as soon as the text is emptied and aborts what was in flight', async () => {
    const requests = deferredFetch();
    const { result, rerender } = setup(PIPELINE_A);

    await wait(DEBOUNCE_MS);
    await requests[0]!.respond({ errors: ['a'] });
    rerender({ yaml: PIPELINE_B });
    await wait(DEBOUNCE_MS);

    rerender({ yaml: '' });
    expect(result.current).toEqual({ result: null, pending: false });
    expect(requests[1]!.signal.aborted).toBe(true);

    await wait(DEBOUNCE_MS * 4);
    expect(requests).toHaveLength(2);
  });

  it('cancels the pending timer and aborts the request on unmount', async () => {
    const requests = deferredFetch();
    const first = setup(PIPELINE_A);

    await wait(DEBOUNCE_MS);
    first.unmount();
    expect(requests[0]!.signal.aborted).toBe(true);

    const second = setup(PIPELINE_B);

    second.unmount();
    await wait(DEBOUNCE_MS * 4);
    expect(requests).toHaveLength(1);
  });

  // An answer can still resolve after its abort (e.g. one already parsed when the
  // text changed); landing after the newer one, it must not replace it.
  it(
    'ignores a stale answer that resolves despite the abort',
    async () => {
      const requests: Array<(body: ValidationResult) => Promise<void>> = [];

      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise<Response>(resolve => {
              requests.push(body =>
                act(async () => {
                  resolve(new Response(JSON.stringify(body), { status: 200 }));
                })
              );
            })
        )
      );
      const { result, rerender } = setup(PIPELINE_A);

      await wait(DEBOUNCE_MS);
      rerender({ yaml: PIPELINE_B });
      await wait(DEBOUNCE_MS);
      await requests[1]!({ errors: ['b'] });
      await requests[0]!({ errors: ['a'] });

      expect(result.current).toEqual({
        result: { errors: ['b'] },
        pending: false
      });
    }
  );
});
