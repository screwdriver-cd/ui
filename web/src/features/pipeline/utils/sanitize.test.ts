import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('keeps text and formatting but drops scripts and every attribute but a[href]', () => {
    const out = sanitizeHtml(
      '<b onclick="x()" style="color:red">Maintenance</b><script>alert(1)</script> <a href="https://x.dev/a" class="c">details</a>'
    );

    expect(out).toContain('<b>Maintenance</b>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
    expect(out).toContain('href="https://x.dev/a"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).not.toContain('class=');
  });

  it('removes javascript: links and embedded content', () => {
    const out = sanitizeHtml(
      '<a href="javascript:alert(1)">x</a><iframe src="https://evil"></iframe><svg onload="x()"></svg>'
    );

    expect(out).not.toContain('javascript');
    expect(out).not.toContain('iframe');
    expect(out).not.toContain('svg');
    expect(out).toContain('>x</a>');
  });

  it('is empty for non-strings', () => {
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml(5)).toBe('');
  });
});
