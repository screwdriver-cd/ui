import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ICON_FONT_GLYPHS } from '../render/status';

describe('screwdriver icon font vs the Ember graph util', () => {
  it('uses the same code points as STATUS_MAP in d3-graph-util.js', () => {
    const src = readFileSync(
      resolve(process.cwd(), '../app/utils/pipeline/graph/d3-graph-util.js'),
      'utf8'
    );
    const block = src.slice(
      src.indexOf('const STATUS_MAP'),
      src.indexOf('export { STATUS_MAP }')
    );
    const legacy = Object.fromEntries(
      [...block.matchAll(/(\w+): \{ icon: '\\u([0-9a-f]{4})' \}/g)].map(m => [
        m[1],
        String.fromCharCode(parseInt(m[2] as string, 16))
      ])
    );

    expect(Object.keys(legacy).length).toBeGreaterThanOrEqual(15);
    expect(ICON_FONT_GLYPHS).toEqual(legacy);
  });
});
