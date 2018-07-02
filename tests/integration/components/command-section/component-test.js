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
  docker: {
    image: 'test',
    command: 'example'
  },
  pipelineId: 100
};

moduleForComponent('command-section', 'Integration | Component | command section', {
  integration: true
});

test('it renders', function (assert) {
  this.set('mock', COMMAND);

  this.render(hbs`{{command-section command=mock}}`);

  assert.equal(this.$('header').text().trim(), 'foo/bar');
  assert.equal(this.$('p').text().trim(), 'A test example');
});
