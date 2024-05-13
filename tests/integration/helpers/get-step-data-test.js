import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | get step data', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders a value', async function (assert) {
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

    await render(hbs`{{get-step-data this.buildSteps this.step this.field}}`);
    assert.dom(this.element).hasText('128');
  });

  test('it fetches an object', async function (assert) {
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
    await render(
      hbs`{{#with (get-step-data this.buildSteps this.step) as |s|}}{{s.startTime}}{{/with}}`
    );
    assert.dom(this.element).hasText('1236');
  });
});
