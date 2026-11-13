import { useEffect, useState } from 'react';

/**
 * True once the element has entered the viewport (stays true afterwards, like
 * the Ember in-viewport service which stopped watching after the first enter).
 * Without IntersectionObserver (old browsers, jsdom) it is true immediately.
 * Returns a callback ref so it fits any element type.
 */
export function useInView() {
  const [el, setEl] = useState<Element | null>(null);
  const [seen, setSeen] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (seen || !el) {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [seen, el]);

  return [setEl, seen] as const;
}
