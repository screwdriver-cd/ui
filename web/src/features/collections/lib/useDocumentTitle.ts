import { useEffect } from 'react';

/** Sets document.title while the page is mounted. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;

    document.title = title;

    return () => {
      document.title = previous;
    };
  }, [title]);
}
