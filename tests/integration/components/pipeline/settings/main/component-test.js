import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/settings/main', function (hooks) {
  setupRenderingTest(hooks);

  let pipelinePageState;

  hooks.beforeEach(function () {
    pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getAdminUsers').returns([]);
  });

  test('it renders', async function (assert) {
    const privatePipelineMock = {
      scmRepo: { name: 'myOrg/myRepo', private: true },
      scmUri: 'github.com:12345:master',
      admins: {}
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(privatePipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('.section').exists({ count: 9 });
    assert.dom('.pipeline-settings-danger-zone').exists();
    assert
      .dom('#pipeline-settings-main-visibility')
      .hasText('Visibility: Private');
    assert.dom('.pipeline-settings-danger-zone').exists({ count: 2 });
  });

  test('it does not renders', async function (assert) {
    const pipelineMock = {
      scmRepo: { name: 'myOrg/myRepo' },
      scmUri: 'github.com:12345:master',
      admins: {}
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('.section').exists({ count: 8 });
    assert.dom('.pipeline-settings-danger-zone').exists();
    assert.dom('.pipeline-settings-danger-zone').exists({ count: 1 });
  });

  test('it renders when pipeline visibility is false', async function (assert) {
    const privatePipelineMock = {
      scmRepo: { name: 'myOrg/myRepo', private: true },
      scmUri: 'github.com:12345:master',
      admins: {},
      settings: { public: false }
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(privatePipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('.section').exists({ count: 9 });
    assert.dom('.pipeline-settings-danger-zone').exists();
    assert
      .dom('#pipeline-settings-main-visibility')
      .hasText('Visibility: Private');
    assert.dom('.pipeline-settings-danger-zone').exists({ count: 2 });
  });

  test('it renders when pipeline visibility is true', async function (assert) {
    const privatePipelineMock = {
      scmRepo: { name: 'myOrg/myRepo', private: true },
      scmUri: 'github.com:12345:master',
      admins: {},
      settings: { public: true }
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(privatePipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('.section').exists({ count: 9 });
    assert.dom('.pipeline-settings-danger-zone').exists();
    assert
      .dom('#pipeline-settings-main-visibility')
      .hasText('Visibility: Public');
    assert.dom('.pipeline-settings-danger-zone').exists({ count: 2 });
  });
});
