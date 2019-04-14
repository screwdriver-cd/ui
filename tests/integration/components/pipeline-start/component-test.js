import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline start', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(2);
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('onStartBuild', () => {
      assert.ok(true);
    });
    await render(hbs`{{pipeline-start startBuild=onStartBuild}}`);

    assert.equal(find('button').textContent.trim(), 'Start');
    await click('button');
  });

  test('it renders start PR', async function(assert) {
    assert.expect(3);
    // Starting PR job requires the PR number and PR jobs
    this.set('jobs', ['job1', 'job2']);
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('onPRStartBuild', (prNum, prJobs) => {
      assert.equal(prNum, 5);
      assert.equal(prJobs.length, 2);
    });
    await render(hbs`{{pipeline-start startBuild=onPRStartBuild prNum=5 jobs=jobs}}`);

    assert.equal(find('button').textContent.trim(), 'Start PR-5');
    await click('button');
  });
});
