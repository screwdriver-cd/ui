import { helper } from '@ember/component/helper';

/**
 * Sanitizer which filter out deny elements, and only keep
 * elements with their allowed attributes
 */
class Sanitizer {
  static allowAttributes = {
    a: ['href']
  };

  static denyElements = ['script'];

  static sanitize(html) {
    const parser = new DOMParser();
    const fragment = parser.parseFromString(
      `<html><body>${html}</body></html>`,
      'text/html'
    ).body;

    this.sanitizeNode(fragment);

    return fragment.innerHTML;
  }

  static sanitizeChildren(node) {
    for (let child of node.children) {
      this.sanitizeNode(child);
    }
  }

  static sanitizeNode(node) {
    // Only filter out element node
    if (node.nodeType === node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (this.denyElements.includes(tagName)) {
        node.parentElement.removeChild(node);
      } else {
        const attrs = this.allowAttributes[tagName] || [];

        node.getAttributeNames().forEach(attr => {
          if (!attrs.includes(attr)) {
            node.removeAttribute(attr);
          }
        });

        this.sanitizeChildren(node);
      }
    }

    return '';
  }
}

/**
 * Sanitizes given string
 * @method inputSanitizer
 * @param  {String}  string  String to be sanitized
 * @return {String}          Sanitized string
 */
export function inputSanitizer([string] /* , hash */) {
  if (typeof string !== 'string') {
    return '';
  }
  const sanitizedString = Sanitizer.sanitize(string);

  return sanitizedString;
}

export default helper(inputSanitizer);
