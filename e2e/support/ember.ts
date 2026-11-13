import type { Page } from '@playwright/test';

/**
 * Everything the suite needs to also run against the legacy Ember app (`npm run test:ember`,
 * E2E_FRAMEWORK=ember). Specs never check the framework themselves:
 *
 * - A test the Ember app cannot pass (a rewrite feature or requirement) is tagged `REACT_ONLY`;
 *   `playwright.config.ts` leaves those out of an Ember run. Tests only Ember needs are tagged
 *   `EMBER_ONLY` and live in `specs/ember-only.spec.ts`.
 * - Where Ember's markup differs, the page objects in `support/pages` take Ember's selectors
 *   from here.
 *
 * Retiring Ember: delete this file and `specs/ember-only.spec.ts`, drop the `REACT_ONLY` tags and
 * the `grepInvert` in `playwright.config.ts`, and keep the React side of each page object.
 */
export const isEmber = process.env.E2E_FRAMEWORK === 'ember';

/** For a test that checks a rewrite feature or requirement Ember does not have. */
export const REACT_ONLY = { tag: '@react-only' };

/** For a test of Ember's own behaviour, kept while both apps run the suite. */
export const EMBER_ONLY = { tag: '@ember-only' };

/** Ember's header hides search behind a link and names its menu toggles after their icons. */
export const emberHeader = (page: Page) => ({
  searchBox: () => page.locator('input.search-input'),
  async openSearch() {
    await page.getByRole('link', { name: 'search' }).click();
  },
  helpToggle: () => page.getByRole('button', { name: 'help-circle' }),
  profileToggle: () => page.getByRole('button', { name: /profile-outline/ }),
  // A link with href="#signout".
  signOut: () => page.getByRole('link', { name: 'Sign out' })
});

/** Ember's versions of `support/pages/ui.ts`. */
export const emberUi = (page: Page) => ({
  // ace instead of CodeMirror.
  yamlEditor: () => page.locator('.ace_editor'),
  // Row actions are unnamed icon buttons (edit, refresh, delete).
  deleteTokenButton: (_name: string, description: string) =>
    page.locator('tr', { hasText: description }).locator('button').nth(2),
  // A dismissible BsAlert at the top of the pipeline header.
  scmWarning: () => page.locator('#pipeline-header .alert-warning'),
  dismissScmWarning: () => page.locator('#pipeline-header .alert-warning button.close').click()
});
