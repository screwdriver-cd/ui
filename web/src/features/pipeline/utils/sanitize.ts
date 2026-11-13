/**
 * Banner messages are HTML written by admins. Same rule as Ember's
 * input-sanitizer (keep elements, drop every attribute except `a[href]`),
 * but stricter where Ember is loose: more elements are denied and only
 * http(s), mailto and relative links survive.
 */
const DENY = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
  'svg',
  'math'
]);
const SAFE_HREF = /^(https?:|mailto:|\/|#|\.\.?\/)/i;

function clean(node: Element) {
  Array.from(node.children).forEach(child => {
    const tag = child.tagName.toLowerCase();

    if (DENY.has(tag)) {
      child.remove();

      return;
    }
    child.getAttributeNames().forEach(attr => {
      if (!(tag === 'a' && attr === 'href')) {
        child.removeAttribute(attr);
      }
    });
    if (tag === 'a') {
      const href = (child.getAttribute('href') ?? '').trim();

      if (SAFE_HREF.test(href) || (!href.includes(':') && href !== '')) {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      } else {
        child.removeAttribute('href');
      }
    }
    clean(child);
  });
}

export function sanitizeHtml(html: unknown): string {
  if (typeof html !== 'string') {
    return '';
  }

  const body = new DOMParser().parseFromString(
    `<html><body>${html}</body></html>`,
    'text/html'
  ).body;

  clean(body);

  return body.innerHTML;
}
