import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/header', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders core items', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    const id = 123;
    const url = 'https://gihub.com/test';

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      id,
      scmContext: 'github:github.com',
      scmRepo: { url },
      annotations: {}
    });

    await render(hbs`<Pipeline::Header />`);

    assert.dom('#pipeline-link').hasAttribute('href', `/v2/pipelines/${id}`);
    assert.dom('#parent-pipeline-link').doesNotExist();
    assert.dom('#sonarqube-link').doesNotExist();
    assert.dom('#scm-link').hasAttribute('href', `${url}`);
    assert.dom('#repo-pipelines').exists({ count: 1 });
    assert.dom('#add-to-collection').exists({ count: 1 });
  });

  test('it renders link to parent pipeline', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    const configPipelineId = 999;

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      configPipelineId,
      annotations: {}
    });

    await render(hbs`<Pipeline::Header />`);

    assert
      .dom('#parent-pipeline-link')
      .hasAttribute('href', `/v2/pipelines/${configPipelineId}`);
  });

  test('it renders link to sonarqube project', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    const uri = 'https://sonarqube.com/test';

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      badges: { sonar: { uri } },
      annotations: {}
    });

    await render(hbs`<Pipeline::Header />`);

    assert.dom('#sonarqube-link').hasAttribute('href', `${uri}`);
  });

  test('it renders link to sonarqube', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    const defaultUri = 'https://sonarqube.com';

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      badges: {
        sonar: { defaultUri }
      },
      annotations: {}
    });

    await render(hbs`<Pipeline::Header />`);

    assert.dom('#sonarqube-link').hasAttribute('href', `${defaultUri}`);
  });

  test('it renders dropdown to other pipelines', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');
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
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      id: 123,
      scmUri: 'git.github.com:9876:abc',
      scmRepo: { url: 'https://gihub.com/test' },
      annotations: {}
    });

    await render(hbs`<Pipeline::Header />`);

    assert.dom('#repo-pipelines .dropdown-menu').doesNotExist();
    await click('#repo-pipelines > a.dropdown-toggle');

    assert.dom('#repo-pipelines .dropdown-menu').exists({ count: 1 });
    assert.dom('#repo-pipelines .dropdown-menu > a').exists({ count: 2 });
  });

  test('it renders pipeline description', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    const pipelineDescription = 'This is a test pipeline';

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      id: 123,
      scmContext: 'github:github.com',
      scmRepo: { url: 'https://gihub.com/test' },
      annotations: {
        'screwdriver.cd/pipelineDescription': pipelineDescription
      }
    });

    await render(hbs`<Pipeline::Header />`);

    assert
      .dom('#pipeline-header .pipeline-description')
      .hasText(pipelineDescription);
  });
});
