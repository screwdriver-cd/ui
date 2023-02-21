import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | chart c3', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('data', { columns: [] });
    this.set('oninit', () => {
      assert.ok(this);
    });

    await render(hbs`
      <ChartC3
        @name="test-chart"
        @data={{this.data}}
        @oninit={{this.oninit}}
      />
    `);

    assert.dom('svg').exists({ count: 1 });
    assert.dom('.c3-circle').doesNotExist();
    assert.dom('.c3-event-rect').exists({ count: 1 });

    this.set('data', { columns: [['data', 1]] });

    assert.dom('.c3-circle').exists({ count: 1 });
  });
});
