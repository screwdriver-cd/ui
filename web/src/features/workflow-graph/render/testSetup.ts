import { patchProperty } from '~/test/patch';

/**
 * jsdom shims React Flow needs, for the current test only: call it from a test or a `beforeEach`.
 * Globals are unstubbed and prototypes restored when the test finishes.
 */
export function mockReactFlowEnvironment() {
  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe(target: Element) {
      this.cb(
        [
          {
            target,
            contentRect: { width: 1000, height: 600 }
          } as ResizeObserverEntry
        ],
        this as unknown as ResizeObserver
      );
    }
    unobserve() {}
    disconnect() {}
  }

  class Matrix {
    m22: number;
    constructor(init?: string) {
      const scale = init?.match(/scale\(([\d.]+)\)/);

      this.m22 = scale ? Number(scale[1]) : 1;
    }
  }

  vi.stubGlobal('ResizeObserver', RO);
  vi.stubGlobal('DOMMatrixReadOnly', Matrix);
  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: FrameRequestCallback) =>
      setTimeout(() => cb(0), 0) as unknown as number
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));

  const size = {
    offsetHeight: 600,
    offsetWidth: 1000,
    clientHeight: 600,
    clientWidth: 1000
  };

  for (const [key, value] of Object.entries(size)) {
    patchProperty(HTMLElement.prototype, key, { get: () => value });
  }
  patchProperty(SVGElement.prototype, 'getBBox', {
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }) as DOMRect
  });
  if (!('escape' in CSS)) {
    patchProperty(CSS, 'escape', {
      value: (s: string) => s.replace(/["\\]/g, '\\$&')
    });
  }
}
