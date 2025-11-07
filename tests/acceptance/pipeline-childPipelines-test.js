import { currentURL, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';
import { PARENT_PIPELINE_ID } from '../mock/pipeline';

module('Acceptance | child pipeline', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /pipelines/:id/child-pipelines', async function (assert) {
    const url = `/pipelines/${PARENT_PIPELINE_ID}/child-pipelines`;

    await visit(url);

    assert.equal(currentURL(), url);
    assert.dom('#banners').exists({ count: 1 });
    assert.equal(getPageTitle(), 'Child Pipelines', 'Page title is correct');
    assert.dom('.appId:nth-child(1)').hasText('Name');
    assert.dom('tbody tr:first-child td.appId').hasText('child/one');
    assert.dom('tbody tr:first-child td.branch').hasText('master');
    assert.dom('tbody tr:nth-child(2) td.appId').hasText('child/two');
    assert.dom('tbody tr:nth-child(2) td.branch').hasText('master');
    assert
      .dom('div.alert > span')
      .hasText(
        'You have one or more inactive pipelines. You can activate these by adding back the corresponding SCM URL in the yaml configuration.'
      );
  });
});
