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

module('Integration | Component | bread crumbs', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const { $ } = this;

    this.set('mocks', TEST_TEMPLATES);
    await render(hbs`{{bread-crumbs crumbs=mocks}}`);

    assert.equal($('div a').length, 2);
    assert.equal(
      $('div a')
        .text()
        .trim(),
      'TemplatesTest-Namespace'
    );
  });
});
