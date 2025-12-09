import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/settings/main', function (hooks) {
  setupRenderingTest(hooks);

  let pipelinePageState;

  let pipelineMock;

  hooks.beforeEach(function () {
    pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    pipelineMock = {
      scmRepo: { name: 'myOrg/myRepo' },
      scmUri: 'github.com:12345:master',
      admins: {}
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
    sinon.stub(pipelinePageState, 'getAdminUsers').returns([]);
  });

  test('it renders', async function (assert) {
    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('.section').exists({ count: 9 });
    assert.dom('.pipeline-settings-danger-zone').exists();
    assert.dom('.pipeline-settings-danger-zone').exists({ count: 2 });
  });
});
