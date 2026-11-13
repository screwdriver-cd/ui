import { expect, type Page } from '@playwright/test';

export const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

/** The document itself must never scroll vertically; only inner regions may. */
export async function expectNoPageScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement as Element;

    return el.scrollHeight - window.innerHeight;
  });

  expect(overflow).toBeLessThanOrEqual(0);
}
