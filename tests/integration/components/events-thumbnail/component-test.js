import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import $ from 'jquery';

const eventsInfo = [
  {
    statusColor: 'build-success',
    duration: 10
  },
  {
    statusColor: 'build-failure',
    duration: 20
  }
];
const BUILD_SUCCESS_COLOR = 'rgb(26, 197, 103)';
const BUILD_FAILURE_COLOR = 'rgb(220, 20, 45)';
const BUILD_EMPTY_COLOR = 'rgb(232, 232, 232)';

module('Integration | Component | events thumbnail', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set('eventsInfo', eventsInfo);

    await render(hbs`{{events-thumbnail events=eventsInfo}}`);
    assert.dom('svg').exists({ count: 1 });
    assert.dom('svg rect').exists({ count: 20 });

    const rect1 = $('svg rect:nth-of-type(1)');
    const rect2 = $('svg rect:nth-of-type(2)');

    assert.equal(rect1.css('fill'), BUILD_SUCCESS_COLOR);
    assert.equal(rect1.css('height'), '20px');
    assert.equal(rect2.css('fill'), BUILD_FAILURE_COLOR);
    assert.equal(rect2.css('height'), '40px');
    assert.equal($('svg rect:nth-of-type(3)').css('fill'), BUILD_EMPTY_COLOR);
  });
});
