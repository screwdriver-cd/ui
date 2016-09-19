import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-banner', 'Integration | Component | build banner', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = {
    status: 'SUCCESS',
    cause: 'monkeys with typewriters',
    sha: 'abcd1234567890',
    buildDuration: 5000
  };
  const jobMock = {
    name: 'PR-671'
  };
  const pipelineMock = {
    appId: 'foo:bar',
    branch: 'master',
    hubUrl: 'http://github.com/foo/bar'
  };

  this.set('buildMock', buildMock);
  this.set('jobMock', jobMock);
  this.set('pipelineMock', pipelineMock);
  this.render(hbs`{{build-banner build=buildMock job=jobMock pipeline=pipelineMock}}`);

  assert.equal($('h1').text().trim(), 'PR-671');
  assert.equal($('span.sha').text().trim(), '#abcd12');
  assert.equal($('.cause').text().trim(), 'monkeys with typewriters');
  assert.equal($('.duration').text().trim(), 'a few seconds');
});
