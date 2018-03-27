import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('get-step-data', 'helper:get-step-data', {
  integration: true
});

test('it renders a value', function (assert) {
  this.set('buildSteps', [
    {
      name: 'banana',
      startTime: '1234',
      endTime: '1235',
      code: 128
    },
    {
      name: 'monkey',
      startTime: '1236',
      endTime: '1239',
      code: 0
    }
  ]);
  this.set('step', 'banana');
  this.set('field', 'code');

  this.render(hbs`{{get-step-data buildSteps step field}}`);
  assert.equal(this.$().text().trim(), '128');
});

test('it fetches an object', function (assert) {
  this.set('buildSteps', [
    {
      name: 'banana',
      startTime: '1234',
      endTime: '1235',
      code: 128
    },
    {
      name: 'monkey',
      startTime: '1236',
      endTime: '1239',
      code: 0
    }
  ]);
  this.set('field', 'startTime');
  this.set('step', 'monkey');
  this.render(hbs`{{#with (get-step-data buildSteps step) as |s|}}{{s.startTime}}{{/with}}`);
  assert.equal(this.$().text().trim(), '1236');
});
