import type { Page } from '@playwright/test';
import { emberUi, isEmber } from '../ember';

/** Controls that specs share across pages. */
export function ui(page: Page) {
  return {
    /** The validator's and create page's YAML editor. */
    yamlEditor: () => page.locator('.cm-content'),
    /** A user access token's delete button (Ember finds the row by its description). */
    deleteTokenButton: (name: string, _description: string) =>
      page.getByRole('button', { name: `Delete token ${name}` }),
    /** The warning shown instead of the start dialog when signed in to another SCM. */
    scmWarning: () => page.locator('#scm-mismatch-warning'),
    dismissScmWarning: () => page.locator('#scm-mismatch-warning .btn-close').click(),
    ...(isEmber ? emberUi(page) : {})
  };
}
