import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const TEMPLATE_WITH_NAMESPACE = {
  id: 2,
  config: {
    image: 'node:8'
  },
  description: 'A test example',
  labels: ['car', 'armored'],
  maintainer: 'bruce@wayne.com',
  namespace: 'foo',
  name: 'bar',
  fullName: 'foo/bar',
  version: '2.0.0'
};

const TEMPLATE = {
  id: 2,
  config: {
    image: 'node:8'
  },
  description: 'A test example',
  labels: ['car', 'armored'],
  maintainer: 'bruce@wayne.com',
  name: 'foo/bar',
  fullName: 'foo/bar',
  version: '2.0.0'
};

moduleForComponent('template-section', 'Integration | Component | template section', {
  integration: true
});

test('it renders', function (assert) {
  this.set('mock', TEMPLATE);

  this.render(hbs`{{template-section template=mock}}`);

  assert.equal(this.$('header a').text().trim(), 'foo/bar');
  assert.equal(this.$('p').text().trim(), 'A test example');
});

test('it renders for template with namespace', function (assert) {
  this.set('mock', TEMPLATE_WITH_NAMESPACE);

  this.render(hbs`{{template-section template=mock}}`);

  assert.equal(this.$('header').text().trim(), 'foo/bar');
  assert.equal(this.$('p').text().trim(), 'A test example');
});
