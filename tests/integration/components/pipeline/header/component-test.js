import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/header', function (hooks) {
  setupRenderingTest(hooks);

  const pipelineId = 123;
  const url = 'https://gihub.com/test';
  const pipeline = {};

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns(pipeline);

    pipeline.id = pipelineId;
    pipeline.scmContext = 'github:github.com';
    pipeline.scmRepo = { url, branch: 'main' };
    pipeline.annotations = {};
  });

  test('it renders core items', async function (assert) {
    await render(hbs`<Pipeline::Header />`);

    assert
      .dom('#pipeline-link')
      .hasAttribute('href', `/v2/pipelines/${pipelineId}`);
    assert.dom('#parent-pipeline-link').doesNotExist();
    assert.dom('#sonarqube-link').doesNotExist();
    assert.dom('#scm-link').hasAttribute('href', `${url}`);
    assert.dom('#repo-pipelines').exists({ count: 1 });
    assert.dom('#repo-pipelines .branch').hasText('main');
    assert.dom('#add-to-collection').exists({ count: 1 });
  });

  test('it renders link to parent pipeline', async function (assert) {
    const configPipelineId = 999;

    pipeline.configPipelineId = configPipelineId;

    await render(hbs`<Pipeline::Header />`);

    assert
      .dom('#parent-pipeline-link')
      .hasAttribute('href', `/v2/pipelines/${configPipelineId}`);
  });

  test('it renders link to sonarqube project', async function (assert) {
    const uri = 'https://sonarqube.com/test';

    pipeline.badges = { sonar: { uri } };

    await render(hbs`<Pipeline::Header />`);

    assert.dom('#sonarqube-link').hasAttribute('href', `${uri}`);
  });

  test('it renders link to sonarqube', async function (assert) {
    const defaultUri = 'https://sonarqube.com';

    pipeline.badges = { sonar: { defaultUri } };

    await render(hbs`<Pipeline::Header />`);

    assert.dom('#sonarqube-link').hasAttribute('href', `${defaultUri}`);
  });

  test('it renders branch with root directory', async function (assert) {
    const rootDir = 'somethine/else';

    pipeline.scmRepo.rootDir = rootDir;
    await render(hbs`<Pipeline::Header />`);

    assert.dom('#repo-pipelines .branch').hasText(`main:${rootDir}`);
  });

  test('it renders dropdown to other pipelines', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([
      {
        id: 123,
        scmUri: 'git.github.com:9876:abc',
        scmRepo: { branch: 'abc' }
      },
      {
        id: 124,
        scmUri: 'git.github.com:9876:def',
        scmRepo: { branch: 'def' }
      },
      {
        id: 125,
        scmUri: 'git.github.com:9876:ghi',
        scmRepo: { branch: 'ghi' }
      }
    ]);

    pipeline.scmUri = 'git.github.com:9876:abc';

    await render(hbs`<Pipeline::Header />`);

    assert.dom('#repo-pipelines .dropdown-menu').doesNotExist();
    await click('#repo-pipelines > a.dropdown-toggle');

    assert.dom('#repo-pipelines .dropdown-menu').exists({ count: 1 });
    assert.dom('#repo-pipelines .dropdown-menu > a').exists({ count: 2 });

    delete pipeline.scmUri;
  });

  test('it renders pipeline description', async function (assert) {
    const pipelineDescription = 'This is a test pipeline';

    pipeline.annotations = {
      'screwdriver.cd/pipelineDescription': pipelineDescription
    };

    await render(hbs`<Pipeline::Header />`);

    assert
      .dom('#pipeline-header .pipeline-description')
      .hasText(pipelineDescription);
  });
});
