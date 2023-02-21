import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const TEMPLATE_DATA_WITH_NAME = {
  label: 'Name',
  prefix: 'collection.detail',
  component: 'tc-collection-linker',
  record: {
    namespace: 'foo',
    name: 'bar',
    trusted: true
  }
};

const TEMPLATE_DATA_WITH_NAMESPACE = {
  label: 'Namespace',
  prefix: 'collection.detail',
  component: 'tc-collection-linker',
  record: {
    namespace: 'baz',
    name: 'qux',
    trusted: false
  }
};

module('Integration | Component | tc collection linker', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the link to collection namespace page', async function (assert) {
    Object.keys(TEMPLATE_DATA_WITH_NAMESPACE).forEach(prop =>
      this.set(prop, TEMPLATE_DATA_WITH_NAMESPACE[prop])
    );

    await render(
      hbs`<TcCollectionLinker @record={{this.record}} @component={{this.component}} @prefix={{this.prefix}} @label={{this.label}} />`
    );

    assert.dom('a .namespace').hasText('baz');
  });

  test('it renders the link to collection detail page', async function (assert) {
    Object.keys(TEMPLATE_DATA_WITH_NAME).forEach(prop =>
      this.set(prop, TEMPLATE_DATA_WITH_NAME[prop])
    );

    await render(
      hbs`<TcCollectionLinker @record={{this.record}} @component={{this.component}} @prefix={{this.prefix}} @label={{this.label}} />`
    );

    assert.dom('a .name').hasText('bar');
    assert.dom('svg').exists({ count: 1 });
  });
});
