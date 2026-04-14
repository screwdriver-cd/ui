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

    assert.dom('.section').exists({ count: 10 });
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

    assert.dom('.section').exists({ count: 9 });
    assert.dom('.pipeline-settings-danger-zone').exists();
    assert.dom('.pipeline-settings-danger-zone').exists({ count: 1 });
  });

  test('it disabled edit pipeline details button for child pipeline', async function (assert) {
    const pipelineMock = {
      scmRepo: { name: 'myOrg/myRepo', private: true },
      scmUri: 'github.com:12345:master',
      admins: {},
      configPipelineId: 321
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('#edit-pipeline-configuration').isDisabled();
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

    assert.dom('.section').exists({ count: 10 });
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

    assert.dom('.section').exists({ count: 10 });
    assert.dom('.pipeline-settings-danger-zone').exists();
    assert
      .dom('#pipeline-settings-main-visibility')
      .hasText('Visibility: Public');
    assert.dom('.pipeline-settings-danger-zone').exists({ count: 2 });
  });

  test('it shows pipeline state as ACTIVE when pipeline is enabled', async function (assert) {
    const pipelineMock = {
      scmRepo: { name: 'myOrg/myRepo' },
      scmUri: 'github.com:12345:master',
      admins: {},
      state: 'ACTIVE'
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert
      .dom('#pipeline-settings-main-pipeline-state')
      .hasText('State: ACTIVE');
  });

  test('it shows pipeline state as DISABLED when pipeline is disabled', async function (assert) {
    const pipelineMock = {
      scmRepo: { name: 'myOrg/myRepo' },
      scmUri: 'github.com:12345:master',
      admins: {},
      state: 'DISABLED'
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert
      .dom('#pipeline-settings-main-pipeline-state')
      .hasText('State: DISABLED');
  });

  test('it shows state changer info when stateChanger is present', async function (assert) {
    const pipelineMock = {
      scmRepo: { name: 'myOrg/myRepo' },
      scmUri: 'github.com:12345:master',
      admins: {},
      state: 'DISABLED',
      stateChanger: 'jdoe',
      stateChangeTime: new Date().toISOString(),
      stateChangeMessage: 'Disabling for maintenance'
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('#pipeline-settings-main-state-changer').exists();
    assert
      .dom('#pipeline-settings-main-state-changer')
      .containsText('Disabled');
    assert.dom('#pipeline-settings-main-state-changer').containsText('jdoe');
    assert.dom('#pipeline-settings-main-state-change-message').exists();
    assert
      .dom('#pipeline-settings-main-state-change-message')
      .containsText('Disabling for maintenance');
  });

  test('it does not show state changer info when stateChanger is absent', async function (assert) {
    const pipelineMock = {
      scmRepo: { name: 'myOrg/myRepo' },
      scmUri: 'github.com:12345:master',
      admins: {},
      state: 'ACTIVE'
    };

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);

    await render(hbs`<Pipeline::Settings::Main />`);

    assert.dom('#pipeline-settings-main-state-changer').doesNotExist();
    assert.dom('#pipeline-settings-main-state-change-message').doesNotExist();
  });
});
