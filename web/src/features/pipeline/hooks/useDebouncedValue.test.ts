import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = (value: string, delayMs = 300) =>
    renderHook(({ value, delayMs }) => useDebouncedValue(value, delayMs), {
      initialProps: { value, delayMs }
    });

  it('returns the initial value straight away', () => {
    const { result } = setup('a');

    expect(result.current).toBe('a');
  });

  it('only takes a new value once it has been stable for the delay', () => {
    const { result, rerender } = setup('a');

    rerender({ value: 'b', delayMs: 300 });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('b');
  });

  it('restarts the wait on every change and skips intermediate values', () => {
    const { result, rerender } = setup('a');

    rerender({ value: 'ab', delayMs: 300 });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'abc', delayMs: 300 });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });

  it('honours a changed delay', () => {
    const { result, rerender } = setup('a', 300);

    rerender({ value: 'b', delayMs: 1000 });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(700));
    expect(result.current).toBe('b');
  });

  it('clears the pending timer on unmount', () => {
    const { rerender, unmount } = setup('a');

    rerender({ value: 'b', delayMs: 300 });
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
