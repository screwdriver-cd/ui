import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | chart c3', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set('data', { columns: [] });
    this.set('oninit', () => {
      assert.ok(this);
    });

    await render(hbs`
      {{chart-c3
        name="test-chart"
        data=data
        oninit=oninit
      }}
    `);

    assert.equal(findAll('svg').length, 1);
    assert.equal(findAll('.c3-circle').length, 0);
    assert.equal(findAll('.c3-event-rect').length, 1);

    this.set('data', { columns: [['data', 1]] });

    assert.equal(findAll('.c3-circle').length, 1);
  });
});
