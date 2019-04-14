import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('helper:x-duration', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders a duration given two parsable times in HH:mm:ss format', async function(assert) {
    this.set('time1', 1478912844724);
    this.set('time2', 1478912845724);

    await render(hbs`{{x-duration time1 time2}}`);

    assert.dom('*').hasText('00:00:01');

    this.set('time1', '2016-11-04T20:09:41.238Z');
    this.set('time2', '2016-11-04T20:09:44.238Z');

    await render(hbs`{{x-duration time1 time2}}`);

    assert.dom('*').hasText('00:00:03');
  });
});
