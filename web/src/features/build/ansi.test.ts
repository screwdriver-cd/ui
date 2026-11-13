import { AnsiLines } from './ansi';

describe('AnsiLines', () => {
  it('carries a colour opened on one line on to the next', () => {
    const ansi = new AnsiLines();
    const lines = [{ m: '\u001b[31mred starts' }, { m: 'still red\u001b[0m' }, { m: 'plain' }];

    expect(ansi.get(lines, 1)).toContain('still red');
    expect(ansi.get(lines, 1)).toMatch(/color:rgb\(187,0,0\)/);
    expect(ansi.get(lines, 2)).toBe('plain');
  });

  it('escapes HTML', () => {
    expect(new AnsiLines().get([{ m: '<b>x</b>' }], 0)).toBe('&lt;b&gt;x&lt;/b&gt;');
  });

  it('keeps parsed lines when more are appended and starts over for another log', () => {
    const ansi = new AnsiLines();
    const first = [{ m: '\u001b[32mgreen' }];

    ansi.get(first, 0);
    expect(ansi.get([...first, { m: 'more' }], 1)).toMatch(/color:rgb\(0,187,0\)/);
    expect(ansi.get([{ m: 'other step' }], 0)).toBe('other step');
  });
});
