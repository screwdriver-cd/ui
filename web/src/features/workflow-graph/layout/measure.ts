/** Text measurement for node sizing. Canvas in the browser, an estimate elsewhere (jsdom, SSR). */

const WIDE_RANGES: Array<[number, number]> = [
  [0x1100, 0x115f],
  [0x2e80, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x20000, 0x3fffd]
];

const isWide = (cp: number) => WIDE_RANGES.some(([a, b]) => cp >= a && cp <= b);

/** Average-width estimate: CJK/fullwidth glyphs are one em wide, others ~0.58 em. */
export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;

  for (const ch of text) {
    const cp = ch.codePointAt(0) as number;

    if (isWide(cp)) em += 1;
    else if (cp < 0x20) em += 0;
    else if ("ilI.,:;|!'".includes(ch)) em += 0.3;
    else if ('mwMW@'.includes(ch)) em += 0.9;
    else em += 0.58;
  }

  return Math.ceil(em * fontSize);
}

export type TextMeasurer = (text: string) => number;

const isJsdom = () =>
  typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);

/** `font` is a CSS font shorthand, e.g. `500 13px system-ui`. */
export function createTextMeasurer(
  font = '500 13px system-ui, sans-serif',
  fontSize = 13
): TextMeasurer {
  const fallback: TextMeasurer = text => estimateTextWidth(text, fontSize);

  if (isJsdom()) return fallback;

  let ctx: {
    font: string;
    measureText: (t: string) => { width: number };
  } | null = null;

  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      ctx = new OffscreenCanvas(1, 1).getContext('2d') as typeof ctx;
    } else if (typeof document !== 'undefined') {
      ctx = document.createElement('canvas').getContext('2d');
    }
  } catch {
    ctx = null;
  }

  if (!ctx) return fallback;

  const c = ctx;

  c.font = font;
  const cache = new Map<string, number>();

  return text => {
    let w = cache.get(text);

    if (w === undefined) {
      w = Math.ceil(c.measureText(text).width);
      cache.set(text, w);
    }

    return w;
  };
}
