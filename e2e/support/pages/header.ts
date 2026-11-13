import type { Page } from '@playwright/test';
import { emberHeader, isEmber } from '../ember';

/** App header. */
export function header(page: Page) {
  return {
    searchBox: () => page.getByRole('banner').getByRole('searchbox', { name: 'Search', exact: true }),
    // Search sits behind an icon: the button toggles it, so call this only while it is closed.
    async openSearch() {
      await page.getByRole('banner').getByRole('button', { name: 'Search', exact: true }).click();
    },
    async search(term: string) {
      await this.openSearch();
      await this.searchBox().fill(term);
      await this.searchBox().press('Enter');
    },
    helpToggle: () => page.getByRole('button', { name: 'Help' }),
    profileToggle: () => page.getByRole('button', { name: 'Profile' }),
    userSettingsLink: () => page.getByRole('link', { name: 'User Settings' }),
    signOut: () => page.getByRole('button', { name: 'Sign out' }),
    createLink: () => page.getByRole('link', { name: 'Create Pipeline' }),
    ...(isEmber ? emberHeader(page) : {})
  };
}
