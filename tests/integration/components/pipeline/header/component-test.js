import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/header', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders core items', async function (assert) {
    this.setProperties({
      pipeline: {
        id: 123,
        scmContext: 'github:github.com',
        scmRepo: { url: 'https://gihub.com/test' },
        annotations: {}
      }
    });

    await render(hbs`<Pipeline::Header
      @pipeline={{this.pipeline}}
      @collections={{this.collections}}
    />`);

    assert
      .dom('#pipeline-link')
      .hasAttribute('href', `/v2/pipelines/${this.pipeline.id}`);
    assert.dom('#parent-pipeline-link').doesNotExist();
    assert.dom('#sonarqube-link').doesNotExist();
    assert
      .dom('#scm-link')
      .hasAttribute('href', `${this.pipeline.scmRepo.url}`);
    assert.dom('#repo-pipelines').exists({ count: 1 });
    assert.dom('#add-to-collection').exists({ count: 1 });
  });

  test('it renders link to parent pipeline', async function (assert) {
    this.setProperties({
      pipeline: { configPipelineId: 999, annotations: {} }
    });

    await render(hbs`<Pipeline::Header
      @pipeline={{this.pipeline}}
      @collections={{this.collections}}
    />`);

    assert
      .dom('#parent-pipeline-link')
      .hasAttribute('href', `/v2/pipelines/${this.pipeline.configPipelineId}`);
  });

  test('it renders link to sonarqube project', async function (assert) {
    this.setProperties({
      pipeline: {
        badges: { sonar: { uri: 'https://sonarqube.com/test' } },
        annotations: {}
      }
    });

    await render(hbs`<Pipeline::Header
      @pipeline={{this.pipeline}}
      @collections={{this.collections}}
    />`);

    assert
      .dom('#sonarqube-link')
      .hasAttribute('href', `${this.pipeline.badges.sonar.uri}`);
  });

  test('it renders link to sonarqube', async function (assert) {
    this.setProperties({
      pipeline: {
        badges: {
          sonar: { defaultUri: 'https://sonarqube.com' }
        },
        annotations: {}
      }
    });

    await render(hbs`<Pipeline::Header
      @pipeline={{this.pipeline}}
      @collections={{this.collections}}
    />`);

    assert
      .dom('#sonarqube-link')
      .hasAttribute('href', `${this.pipeline.badges.sonar.defaultUri}`);
  });

  test('it renders dropdown to other pipelines', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(shuttle, 'fetchFromApi').resolves([
      {
        id: 123,
        scmUri: 'git.github.com:9876',
        scmRepo: { branch: 'abc' }
      },
      {
        id: 124,
        scmUri: 'git.github.com:9876',
        scmRepo: { branch: 'def' }
      },
      {
        id: 125,
        scmUri: 'git.github.com:9876',
        scmRepo: { branch: 'ghi' }
      },
      {
        id: 321,
        scmUri: 'git.not.com:9876',
        scmRepo: { branch: 'abc' }
      }
    ]);

    this.setProperties({
      pipeline: {
        id: 123,
        scmUri: 'git.github.com:9876',
        scmRepo: { url: 'https://gihub.com/test' },
        annotations: {}
      }
    });

    await render(hbs`<Pipeline::Header
      @pipeline={{this.pipeline}}
      @collections={{this.collections}}
    />`);

    assert.dom('#repo-pipelines .dropdown-menu').doesNotExist();
    await click('#repo-pipelines > a.dropdown-toggle');

    assert.dom('#repo-pipelines .dropdown-menu').exists({ count: 1 });
    assert.dom('#repo-pipelines .dropdown-menu > a').exists({ count: 2 });
  });

  test('it renders pipeline description', async function (assert) {
    const pipelineDescription = 'This is a test pipeline';

    this.setProperties({
      pipeline: {
        id: 123,
        scmContext: 'github:github.com',
        scmRepo: { url: 'https://gihub.com/test' },
        annotations: {
          'screwdriver.cd/pipelineDescription': pipelineDescription
        }
      }
    });

    await render(hbs`<Pipeline::Header
      @pipeline={{this.pipeline}}
      @collections={{this.collections}}
    />`);

    assert
      .dom('#pipeline-header .pipeline-description')
      .hasText(pipelineDescription);
  });
});
