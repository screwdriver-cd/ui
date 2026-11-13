import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '~/test/render';
import { ICON_FONT_GLYPHS, StatusIcon, glyphFor } from './status';

const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

describe('screwdriver icon font', () => {
  it('every glyph exists in the shipped font', () => {
    const svg = read('public/assets/screwdriver.svg');
    const codes = [...svg.matchAll(/unicode="&#x([0-9a-f]+);"/gi)].map(m =>
      parseInt(m[1] as string, 16)
    );

    expect(codes.length).toBeGreaterThan(0);
    Object.values(ICON_FONT_GLYPHS).forEach(g =>
      expect(codes).toContain(g.codePointAt(0))
    );
  });

  it('serves the font from the same origin (CSP font-src self: no data: fonts)', () => {
    const css = read('src/features/workflow-graph/render/workflow-graph.css');
    const face = css.slice(
      css.indexOf('@font-face'),
      css.indexOf('}', css.indexOf('@font-face'))
    );

    expect(face).toContain("font-family: 'screwdriver'");
    expect(face).toMatch(/url\('\/assets\/screwdriver\.woff/);
    expect(face).not.toMatch(/data:/);
    expect(css).not.toMatch(/url\(\s*['"]?data:/);
    ['woff', 'ttf'].forEach(ext =>
      expect(
        readFileSync(resolve(root, `public/assets/screwdriver.${ext}`)).length
      ).toBeGreaterThan(1000)
    );
  });

  it('renders the glyph as text in the icon font, with an accessible status name', () => {
    renderWithProviders(<StatusIcon status="FAILURE" />);

    const icon = screen.getByRole('img', { name: 'Failure' });

    expect(icon).toHaveTextContent('');
    expect(icon).toHaveClass('wg-icon', 'wg-status--FAILURE');
  });

  it('shows the virtual glyph for virtual nodes without a problem status', () => {
    expect(glyphFor('SUCCESS', true)).toBe('');
    expect(glyphFor(undefined, true)).toBe('');
    expect(glyphFor('FAILURE', true)).toBe('');
    expect(glyphFor('NOPE')).toBe('');
  });
});
