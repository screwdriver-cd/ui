import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline header', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const $ = this.$;

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const pipelineMock = EmberObject.create({
      appId: 'batman/batmobile',
      hubUrl: 'http://example.com/batman/batmobile',
      branch: 'master',
      scmContext: 'github.com'
    });
    const scmMock = EmberObject.create({
      scm: 'github.com',
      scmIcon: 'github'
    });

    this.set('pipelineMock', pipelineMock);
    this.set('scmMock', scmMock);
    await render(hbs`{{pipeline-header pipeline=pipelineMock scmContext=scmMock}}`);

    assert.equal($('h1').text().trim(), 'batman/batmobile');
    assert.equal($($('a').get(1)).text().trim(), 'master');
    assert.equal($($('a').get(1)).attr('href'), 'http://example.com/batman/batmobile');
    assert.equal($('span.scm').text().trim(), 'github.com');
    assert.equal($('.scm > .fa-github').length, 1);
  });

  test('it renders link to parent pipeline for child pipeline', async function(assert) {
    const $ = this.$;

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const pipelineMock = EmberObject.create({
      appId: 'batman/batmobile',
      hubUrl: 'http://example.com/batman/batmobile',
      branch: 'master',
      scmContext: 'github.com',
      configPipelineId: '123'
    });
    const scmMock = EmberObject.create({
      scm: 'github.com',
      scmIcon: 'github'
    });

    this.set('pipelineMock', pipelineMock);
    this.set('scmMock', scmMock);
    await render(hbs`{{pipeline-header pipeline=pipelineMock scmContext=scmMock}}`);

    assert.equal($($('a').get(2)).text().trim(), 'Parent Pipeline');
  });
});
