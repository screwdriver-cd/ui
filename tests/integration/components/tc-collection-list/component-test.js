import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { setBreakpoint } from 'ember-responsive/test-support';

const TEST_TEMPLATES = {
  model: [
    {
      id: 2,
      description: 'A test example',
      labels: ['car', 'armored'],
      maintainer: 'bruce@wayne.com',
      name: 'bar',
      namespace: 'foo',
      version: '2.0.0'
    },
    {
      id: 3,
      description: 'A fruity example',
      labels: ['fruit'],
      maintainer: 'thomas@wayne.com',
      name: 'strawberry',
      namespace: 'banana',
      version: '1.0.0'
    }
  ],
  targetNamespace: 'foo'
};

module('Integration | Component | tc collection list', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    setBreakpoint('desktop');

    Object.keys(TEST_TEMPLATES).forEach(prop =>
      this.set(prop, TEST_TEMPLATES[prop])
    );

    await render(hbs`<TcCollectionList
      @model={{this.model}}
      @collectionType="Collection"
    />
    "This is a collection"
    `);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 5 });
    assert.dom('tbody tr td').exists({ count: 10 });
  });

  test('it renders with filter namespace', async function (assert) {
    setBreakpoint('desktop');

    Object.keys(TEST_TEMPLATES).forEach(prop =>
      this.set(prop, TEST_TEMPLATES[prop])
    );

    await render(hbs`<TcCollectionList
      @model={{this.model}}
      @filteringNamespace={{this.targetNamespace}}
      @collectionType="Collection"
    />
      "This is a collection"
    `);

    assert.dom('header h4 a').hasText('Collection Docs');
    assert
      .dom('header h4 a')
      .hasAttribute('href', 'http://docs.screwdriver.cd/user-guide/collection');
    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 5 });
    assert.dom('tbody tr td').exists({ count: 5 });
  });
});
