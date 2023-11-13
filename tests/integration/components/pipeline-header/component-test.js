import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectScmServiceStub from '../../../helpers/inject-scm';

module('Integration | Component | pipeline header', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const pipelineMock = EmberObject.create({
      appId: 'batman/batmobile',
      hubUrl: 'http://example.com/batman/batmobile',
      branch: 'master',
      scmContext: 'github:github.com'
    });

    injectScmServiceStub(this);

    this.set('pipelineMock', pipelineMock);
    await render(hbs`<PipelineHeader @pipeline={{this.pipelineMock}} />`);

    assert.dom('h1').hasText('batman/batmobile');
    assert.dom('span.branch').hasText('Source code master');
    assert.dom('a.dropdown-toggle').exists();
    assert
      .dom('a.scm')
      .hasAttribute('href', 'http://example.com/batman/batmobile');

    assert.dom('a.scm').hasText('github.com');
    assert.dom('.scm > .fa-github').exists({ count: 1 });
  });

  test('it renders link to parent pipeline for child pipeline', async function (assert) {
    const pipelineMock = EmberObject.create({
      appId: 'batman/batmobile',
      hubUrl: 'http://example.com/batman/batmobile',
      branch: 'master',
      scmContext: 'github:github.com',
      configPipelineId: '123'
    });

    injectScmServiceStub(this);

    this.set('pipelineMock', pipelineMock);
    await render(hbs`<PipelineHeader @pipeline={{this.pipelineMock}} />`);

    assert.dom('a:nth-child(5)').hasText('Parent Pipeline');
  });
});
