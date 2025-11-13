import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';
import { PIPELINE_ID } from '../mock/pipeline';

module('Acceptance | secrets', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(() => {
    localStorage.setItem('oldUi', true);
  });

  hooks.afterEach(() => {
    localStorage.removeItem('oldUi');
  });

  test('visiting /pipelines/:id/secrets', async function (assert) {
    const testUrl = `/pipelines/${PIPELINE_ID}/secrets`;

    await visit(testUrl);

    assert.equal(currentURL(), testUrl);
    assert.equal(getPageTitle(), 'foo/bar > Secrets', 'Page title is correct');
    assert.dom('.secrets tbody tr').exists({ count: 2 });
    assert.dom('.token-list tbody tr').exists({ count: 2 });
  });
});
