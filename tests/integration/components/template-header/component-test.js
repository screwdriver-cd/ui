import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const TEMPLATE = {
  id: 2,
  config: {
    image: 'node:8'
  },
  description: 'A test example',
  labels: ['car', 'armored'],
  maintainer: 'bruce@wayne.com',
  name: 'foo/bar',
  version: '2.0.0'
};

moduleForComponent('template-header', 'Integration | Component | template header', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  this.set('mock', TEMPLATE);
  this.render(hbs`{{template-header template=mock}}`);

  assert.equal($('h1').text().trim(), 'foo/bar (2.0.0)');
  assert.equal($('p').text().trim(), 'A test example');
  assert.equal($('ul li:first-child').text().trim(), 'Released by: bruce@wayne.com');
  assert.equal($('ul li:first-child a').attr('href'), 'mailto:bruce@wayne.com');
  assert.equal($('ul li:last-child').text().trim(), 'Tags: cararmored');
  assert.equal($('h4').text().trim(), 'Usage:');
  // Messy regexp instead of .includes due to phantomjs limitation
  assert.ok(new RegExp('template: foo/bar@2.0.0').test($('pre').text().trim()));
});
