import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-header', 'Integration | Component | pipeline header', {
  integration: true
});

test('it renders', function (assert) {
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
  this.render(hbs`{{pipeline-header pipeline=pipelineMock scmContext=scmMock}}`);

  assert.equal($('h1').text().trim(), 'batman/batmobile');
  assert.equal($($('a').get(1)).text().trim(), 'master');
  assert.equal($($('a').get(1)).attr('href'), 'http://example.com/batman/batmobile');
  assert.equal($('span.scm').text().trim(), 'github.com');
  assert.equal($('.scm > .fa-github').length, 1);
});

test('it renders link to parent pipeline for child pipeline', function (assert) {
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
  this.render(hbs`{{pipeline-header pipeline=pipelineMock scmContext=scmMock}}`);

  assert.equal($($('a').get(2)).text().trim(), 'Parent Pipeline');
});
