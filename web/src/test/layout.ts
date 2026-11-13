/**
 * jsdom has no layout, so virtualized lists would render nothing. Give every
 * element a 800x600 box (rows then each measure 600 and the overscan keeps small
 * lists fully rendered). Call in `beforeEach`; `vi.restoreAllMocks()` undoes it.
 */
export function mockLayout(width = 800, height = 600) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({})
  } as DOMRect);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(width);
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(height);
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width);
}
