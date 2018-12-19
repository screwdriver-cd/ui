import { moduleForComponent, test } from 'ember-qunit';
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

moduleForComponent('tc-collection-linker', 'Integration | Component | tc collection linker', {
  integration: true
});

test('it renders the link to collection namespace page', function (assert) {
  Object.keys(TEMPLATE_DATA_WITH_NAMESPACE).forEach(
    prop => this.set(prop, TEMPLATE_DATA_WITH_NAMESPACE[prop])
  );

  this.render(hbs`{{tc-collection-linker column=column extra=extra value=value}}`);

  assert.equal(this.$('a .namespace').text().trim(), 'baz');
});

test('it renders the link to collection detail page', function (assert) {
  Object.keys(TEMPLATE_DATA_WITH_NAME).forEach(
    prop => this.set(prop, TEMPLATE_DATA_WITH_NAME[prop])
  );

  this.render(hbs`{{tc-collection-linker column=column extra=extra value=value}}`);

  assert.equal(this.$('a .name').text().trim(), 'bar');
});
