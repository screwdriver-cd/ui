import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline-list-coverage-cell', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(2);
    this.set('value', {
      buildId: 243421,
      jobId: 21,
      startTime: '2020-05-06T23:36:46.779Z',
      endTime: '2020-05-06T23:50:18.590Z'
    });

    await render(hbs`{{pipeline-list-coverage-cell value=value}}`);

    assert.equal(this.element.textContent.trim(), '71.4');
    assert.dom('.coverage-value').exists({ count: 1 });
  });
});
