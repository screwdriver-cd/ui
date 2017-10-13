import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('pipeline-header', 'Integration | Component | pipeline header', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelineMock = Ember.Object.create({
    appId: 'batman/batmobile',
    hubUrl: 'http://example.com/batman/batmobile',
    branch: 'master',
    scmContext: 'github.com'
  });
  const scmMock = Ember.Object.create({
    scm: 'github.com',
    scmIcon: 'fa-github'
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
