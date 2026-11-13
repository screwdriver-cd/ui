import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  let original: string;

  beforeEach(() => {
    original = document.title;
    document.title = 'Screwdriver';
  });
  afterEach(() => {
    document.title = original;
  });

  it('sets the title while mounted and restores the previous one on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Collections'));

    expect(document.title).toBe('Collections');

    unmount();
    expect(document.title).toBe('Screwdriver');
  });

  it('follows a changed title and still restores the original on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'First' } }
    );

    expect(document.title).toBe('First');

    rerender({ title: 'Second' });
    expect(document.title).toBe('Second');

    unmount();
    expect(document.title).toBe('Screwdriver');
  });

  it('unwinds nested titles in order', () => {
    const outer = renderHook(() => useDocumentTitle('Outer'));
    const inner = renderHook(() => useDocumentTitle('Inner'));

    expect(document.title).toBe('Inner');

    inner.unmount();
    expect(document.title).toBe('Outer');

    outer.unmount();
    expect(document.title).toBe('Screwdriver');
  });
});
