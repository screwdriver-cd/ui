import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline start', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    assert.expect(2);
    this.set('onStartBuild', () => {
      assert.ok(true);
    });
    await render(hbs`{{pipeline-start startBuild=onStartBuild}}`);

    assert.dom('button').hasText('Start');
    await click('button');
  });

  test('it doesnt render start PR', async function (assert) {
    assert.expect(1);
    // Starting PR job requires the PR number and PR jobs
    this.set('jobs', ['job1', 'job2']);
    this.set('onPRStartBuild', (prNum, prJobs) => {
      assert.equal(prNum, 5);
      assert.equal(prJobs.length, 2);
    });
    await render(
      hbs`{{pipeline-start startBuild=onPRStartBuild prNum=5 jobs=jobs}}`
    );

    assert.dom('button').doesNotExist();
  });
});
