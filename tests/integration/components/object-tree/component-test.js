import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | object tree', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('data', {
      empty: {},
      array: ['foo', 'bar', 'baz'],
      nest: {
        empty: {},
        array: ['qux'],
        value: 'TEST'
      }
    });

    await render(hbs`<ObjectTree @data={{this.data}} />`);

    assert.dom('ul li:nth-of-type(1) span.object-key').hasText('empty:');
    assert
      .dom('ul li:nth-of-type(1) span.object-value')
      .hasText('None defined');
    assert.dom('ul li:nth-of-type(2) span.object-key').hasText('array:');
    assert
      .dom('ul li:nth-of-type(2) span.object-value')
      .hasText('foo, bar, baz');
    assert.dom('ul li:nth-of-type(3) span.object-key').hasText('nest:');
    assert
      .dom('ul li:nth-of-type(3) ul li:nth-of-type(1) span.object-key')
      .hasText('empty:');
    assert
      .dom('ul li:nth-of-type(3) ul li:nth-of-type(1) span.object-value')
      .hasText('None defined');
    assert
      .dom('ul li:nth-of-type(3) ul li:nth-of-type(2) span.object-key')
      .hasText('array:');
    assert
      .dom('ul li:nth-of-type(3) ul li:nth-of-type(2) span.object-value')
      .hasText('qux');
    assert
      .dom('ul li:nth-of-type(3) ul li:nth-of-type(3) span.object-key')
      .hasText('value:');
    assert
      .dom('ul li:nth-of-type(3) ul li:nth-of-type(3) span.object-value')
      .hasText('TEST');
  });

  test('it renders empty when the data is not object', async function (assert) {
    this.set('data', 'Invalid value');

    await render(hbs`<ObjectTree @data={{this.data}} />`);

    assert.dom('span.object-value').hasText('None defined');
  });

  test('it renders empty when the data is empty object', async function (assert) {
    this.set('data', {});

    await render(hbs`<ObjectTree @data={{this.data}} />`);

    assert.dom('span.object-value').hasText('None defined');
  });
});
