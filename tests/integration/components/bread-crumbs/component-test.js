import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
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

module('Integration | Component | bread crumbs', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('mocks', TEST_TEMPLATES);
    await render(hbs`{{bread-crumbs crumbs=mocks}}`);

    assert.dom('div a').exists({ count: 2 });
    assert.dom('div a:first-of-type').hasText('Templates');
    assert.dom('div a:last-of-type').hasText('Test-Namespace');
  });
});
