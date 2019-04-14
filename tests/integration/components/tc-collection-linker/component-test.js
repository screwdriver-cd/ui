import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const TEMPLATE_DATA_WITH_NAME = {
  column: {
    label: 'Name'
  },
  extra: {
    routes: {
      namespace: 'collection.namespace',
      detail: 'collection.detail'
    }
  },
  row: {
    content: {
      namespace: 'foo',
      name: 'bar'
    }
  },
  value: 'bar'
};

const TEMPLATE_DATA_WITH_NAMESPACE = {
  column: {
    label: 'Namespace'
  },
  extra: {
    routes: {
      namespace: 'collection.namespace',
      detail: 'collection.detail'
    }
  },
  row: {
    content: {
      namespace: 'baz'
    }
  },
  value: 'baz'
};

module('Integration | Component | tc collection linker', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders the link to collection namespace page', async function(assert) {
    Object.keys(TEMPLATE_DATA_WITH_NAMESPACE).forEach(
      prop => this.set(prop, TEMPLATE_DATA_WITH_NAMESPACE[prop])
    );

    await render(hbs`{{tc-collection-linker column=column extra=extra value=value}}`);

    assert.equal(find('a .namespace').textContent.trim(), 'baz');
  });

  test('it renders the link to collection detail page', async function(assert) {
    Object.keys(TEMPLATE_DATA_WITH_NAME).forEach(
      prop => this.set(prop, TEMPLATE_DATA_WITH_NAME[prop])
    );

    await render(hbs`{{tc-collection-linker column=column extra=extra value=value}}`);

    assert.equal(find('a .name').textContent.trim(), 'bar');
  });
});
