import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';

module('Integration | Component | pipeline list actions cell', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    set(this, 'jobId', 1);
    set(this, 'jobName', 'a');
    set(this, 'latestBuild', {
      id:  2,
      status: 'RUNNING'
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });

    await render(hbs`{{pipeline-list-actions-cell
      jobId=jobId
      jobName=jobName
      latestBuild=latestBuild
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').doesNotExist();
  });

  test('it renders with stopBuild disabled', async function(assert) {
    set(this, 'jobId', 1);
    set(this, 'jobName', 'a');
    set(this, 'latestBuild', {
      id:  2,
      status: 'SUCCESS'
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });

    await render(hbs`{{pipeline-list-actions-cell
      jobId=jobId
      jobName=jobName
      latestBuild=latestBuild
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').exists({ count: 1 });
  });
});
