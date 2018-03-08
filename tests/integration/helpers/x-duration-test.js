import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('x-duration', 'helper:x-duration', {
  integration: true
});

// Replace this with your real tests.
test('it renders a humanized duration given two parsable times', function (assert) {
  this.set('time1', 1478912844724);
  this.set('time2', 1478912845724);

  this.render(hbs`{{x-duration time1 time2}}`);

  assert.equal(this.$().text().trim(), '1 second');

  this.set('time1', '2016-11-04T20:09:41.238Z');
  this.set('time2', '2016-11-04T20:09:44.238Z');

  this.render(hbs`{{x-duration time1 time2}}`);

  assert.equal(this.$().text().trim(), '3 seconds');
});
