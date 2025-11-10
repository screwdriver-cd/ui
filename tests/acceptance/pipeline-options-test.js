import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { PIPELINE_ID } from '../mock/pipeline';

module('Acceptance | pipeline/options', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /pipelines/:id/options', async function (assert) {
    const url = `/pipelines/${PIPELINE_ID}/options`;

    await visit(url);

    assert.equal(currentURL(), url);
    assert.dom('#banners').exists({ count: 1 });
    assert.dom('section.pipeline li').exists({ count: 6 });
    assert.dom('section.jobs li').exists({ count: 3 });
    assert.dom('section.danger li').exists({ count: 1 });
  });
});
