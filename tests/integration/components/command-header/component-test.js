import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const COMMAND = {
  id: 2,
  namespace: 'foo',
  name: 'bar',
  version: '1.0.0',
  description: 'A test example',
  maintainer: 'test@example.com',
  format: 'docker',
  docker: '{"image":"test","command":"example"}',
  pipelineId: 100
};

moduleForComponent('command-header', 'Integration | Component | command header', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  this.set('mock', COMMAND);
  this.render(hbs`{{command-header command=mock}}`);

  assert.equal($('h1').text().trim(), 'foo/bar (1.0.0)');
  assert.equal($('p').text().trim(), 'A test example');
  assert.equal($('ul li:first-child').text().trim(), 'Released by: test@example.com');
  assert.equal($('ul li:first-child a').attr('href'), 'mailto:test@example.com');
  assert.equal($('h4').text().trim(), 'Usage:');
  assert.equal($('pre').text().trim(), 'sd-cmd exec foo/bar@1.0.0');
});
