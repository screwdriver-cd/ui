import { mockLayout } from '~/test/layout';

/**
 * jsdom has no layout engine and no ResizeObserver, so react-virtuoso renders
 * no rows. This gives every element a `width` x `height` box (rows of the list,
 * the elements Virtuoso marks with `data-index`, are `itemHeight` tall) and a
 * ResizeObserver that reports it on `observe`. Call in `beforeEach`; pair with
 * `vi.restoreAllMocks()` and `vi.unstubAllGlobals()` in `afterEach`.
 */
export function mockVirtualList(width = 800, height = 600, itemHeight = 100) {
  mockLayout(width, height);
  // Virtuoso ignores resize events from elements without an offsetParent (always null in jsdom).
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(
    document.body
  );

  const heightOf = (el: Element) =>
    el.hasAttribute('data-index') ? itemHeight : height;
  const box = (h: number) =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: h,
      width,
      height: h,
      toJSON: () => ({})
    } as DOMRect);

  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      return box(heightOf(this));
    }
  );
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return heightOf(this);
    }
  );

  class FakeResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}

    observe(target: Element) {
      const h = heightOf(target);
      const entry = {
        target,
        contentRect: box(h),
        borderBoxSize: [{ inlineSize: width, blockSize: h }],
        contentBoxSize: [{ inlineSize: width, blockSize: h }],
        devicePixelContentBoxSize: []
      } as unknown as ResizeObserverEntry;

      this.callback([entry], this as unknown as ResizeObserver);
    }

    unobserve() {}

    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
}
