import { parse } from '@formatjs/icu-messageformat-parser';
import { detectLocale } from './locale';
import { messagesByLocale } from './messages';
import { pseudoLocalize } from './pseudo';

describe('detectLocale', () => {
  it('prefers ?locale=, then the saved preference, then browser languages', () => {
    expect(detectLocale('?locale=ja', ['en-US'], 'en')).toBe('ja');
    expect(detectLocale('', ['en-US'], 'ja')).toBe('ja');
    expect(detectLocale('', ['fr-FR', 'ja-JP', 'en-US'], null)).toBe('ja');
    expect(detectLocale('', ['fr-FR'], null)).toBe('en');
    expect(detectLocale('?locale=en-XA', [], null)).toBe('en-XA');
    expect(detectLocale('?locale=xx', [], 'zz')).toBe('en');
  });
});

describe('pseudoLocalize', () => {
  it('accents text, pads it, and keeps ICU arguments intact', () => {
    const out = pseudoLocalize('Hello {name}, you have {count, plural, one {# item} other {# items}}');

    expect(out).toContain('{name}');
    expect(out).toContain('{count,plural,one{');
    expect(out).toContain('other{');
    expect(out.startsWith('[')).toBe(true);
    expect(out).toContain('Ĥéļļö');
  });
});

describe('message catalogs', () => {
  const keys = (dict: Record<string, string>) => Object.keys(dict).sort();

  it('has exactly the same ids in English and Japanese', () => {
    expect(keys(messagesByLocale.ja)).toEqual(keys(messagesByLocale.en));
  });

  it('has no empty messages', () => {
    for (const locale of ['en', 'ja'] as const) {
      for (const [id, text] of Object.entries(messagesByLocale[locale])) {
        expect(text.trim(), `${locale}:${id}`).not.toBe('');
      }
    }
  });
});

describe('message syntax', () => {
  it('parses as ICU in English, Japanese and the pseudo-locale (a bare "<" would open a tag)', () => {
    for (const locale of ['en', 'ja'] as const) {
      for (const [id, text] of Object.entries(messagesByLocale[locale])) {
        expect(() => parse(text), `${locale}:${id}`).not.toThrow();
        expect(() => parse(pseudoLocalize(text)), `en-XA:${id}`).not.toThrow();
      }
    }
  });
});

describe('message usage', () => {
  it('only uses ids that exist', () => {
    const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.*'], {
      query: '?raw',
      eager: true,
      import: 'default'
    }) as Record<string, string>;
    const used = new Set<string>();

    for (const source of Object.values(sources)) {
      for (const match of source.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g)) {
        used.add(match[1] as string);
      }
    }

    const missing = [...used].filter(id => !(id in messagesByLocale.en));

    expect(missing).toEqual([]);
  });
});
