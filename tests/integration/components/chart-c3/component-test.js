import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('chart-c3', 'Integration | Component | chart c3', {
  integration: true
});

test('it renders', function (assert) {
  this.set('data', { columns: [] });
  this.set('onChartInit', (name, instance) => {
    assert.equal(name, 'test-chart');
    assert.ok(instance);
  });

  this.render(hbs`
    {{chart-c3
      name="test-chart"
      data=data
      onChartInit=onChartInit
    }}
  `);

  assert.equal(this.$('svg').length, 1);
  assert.equal(this.$('.c3-circle').length, 0);
  assert.equal(this.$('.c3-event-rect').length, 1);

  this.set('data', { columns: [['data', 1]] });

  assert.equal(this.$('.c3-circle').length, 1);
});
