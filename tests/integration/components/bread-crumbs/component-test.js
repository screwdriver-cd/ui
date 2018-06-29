import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const TEST_TEMPLATES = [
  {
    name: 'Templates',
    params: ['templates']
  },
  {
    name: 'Test-Namespace',
    params: ['templates.namespace', 'Test-Namespace']
  },
  {
    name: 'Test-Name',
    params: ['templates.detail', 'Test-Namespace', 'Test-Name']
  }
];

moduleForComponent('bread-crumbs', 'Integration | Component | bread crumbs', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;

  this.set('mocks', TEST_TEMPLATES);
  this.render(hbs`{{bread-crumbs crumbs=mocks}}`);

  assert.equal($('div a').length, 2);
  assert.equal($('div a').text().trim(), 'TemplatesTest-Namespace');
});
