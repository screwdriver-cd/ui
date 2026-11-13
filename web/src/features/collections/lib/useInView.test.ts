import { act, renderHook } from '@testing-library/react';
import { useInView } from './useInView';

type Callback = (entries: Array<Partial<IntersectionObserverEntry>>) => void;

/** A controllable IntersectionObserver: tests fire `callback` themselves. */
function stubObserver() {
  const instances: Array<{
    callback: Callback;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  class FakeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);

    constructor(callback: Callback) {
      instances.push({
        callback,
        observe: this.observe,
        disconnect: this.disconnect
      });
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeObserver);

  return instances;
}

describe('useInView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is true immediately when IntersectionObserver is not available', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const { result } = renderHook(() => useInView());

    expect(result.current[1]).toBe(true);
  });

  it('does not observe until an element is attached', () => {
    const observers = stubObserver();
    const { result } = renderHook(() => useInView());

    expect(result.current[1]).toBe(false);
    expect(observers).toHaveLength(0);
  });

  it('observes the attached element and becomes true when it intersects', () => {
    const observers = stubObserver();
    const el = document.createElement('div');
    const { result } = renderHook(() => useInView());

    act(() => result.current[0](el));
    expect(observers).toHaveLength(1);
    expect(observers[0]!.observe).toHaveBeenCalledWith(el);

    act(() => observers[0]!.callback([{ isIntersecting: false }]));
    expect(result.current[1]).toBe(false);

    act(() =>
      observers[0]!.callback([
        { isIntersecting: false },
        { isIntersecting: true }
      ])
    );
    expect(result.current[1]).toBe(true);
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });

  it('stays true after leaving the viewport and does not observe again', () => {
    const observers = stubObserver();
    const { result } = renderHook(() => useInView());

    act(() => result.current[0](document.createElement('div')));
    act(() => observers[0]!.callback([{ isIntersecting: true }]));
    act(() => observers[0]!.callback([{ isIntersecting: false }]));
    expect(result.current[1]).toBe(true);

    act(() => result.current[0](document.createElement('span')));
    expect(result.current[1]).toBe(true);
    expect(observers).toHaveLength(1);
  });

  it('moves the observer to a new element when the ref changes', () => {
    const observers = stubObserver();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const { result } = renderHook(() => useInView());

    act(() => result.current[0](first));
    act(() => result.current[0](second));

    expect(observers).toHaveLength(2);
    expect(observers[0]!.disconnect).toHaveBeenCalled();
    expect(observers[1]!.observe).toHaveBeenCalledWith(second);
  });

  it('disconnects on unmount when the element was never seen', () => {
    const observers = stubObserver();
    const { result, unmount } = renderHook(() => useInView());

    act(() => result.current[0](document.createElement('div')));
    expect(observers[0]!.disconnect).not.toHaveBeenCalled();

    unmount();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });
});
