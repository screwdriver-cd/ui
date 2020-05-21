import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';

module('Integration | Component | pipeline list actions cell', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'RUNNING'
      },
      startSingleBuild: () => {
        assert.ok(true);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    assert.expect(4);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').doesNotExist();
  });

  test('it renders queued build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'QUEUED'
      },
      startSingleBuild: () => {
        assert.ok(true);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    assert.expect(4);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').doesNotExist();
  });

  test('it renders blocked build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'BLOCKED'
      },
      startSingleBuild: () => {
        assert.ok(true);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    assert.expect(4);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').doesNotExist();
  });

  test('it renders frozen build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'FROZEN'
      },
      startSingleBuild: () => {
        assert.ok(true);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.expect(4);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').doesNotExist();
  });

  test('it renders created build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'CREATED'
      },
      startSingleBuild: () => {
        assert.ok(true);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    assert.expect(4);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').doesNotExist();
  });

  test('it renders with aborted build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'ABORTED'
      },
      startSingleBuild: () => {
        assert.ok(true);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    assert.expect(4);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').exists({ count: 1 });
  });

  test('it renders with successful build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'SUCCESS'
      },
      startSingleBuild: () => {
        assert.ok(true);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    assert.expect(4);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').exists({ count: 1 });
  });

  test('start build from latest successful', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'RUNNING'
      },
      startSingleBuild: (jobId, jobName, status) => {
        assert.equal(jobId, 1);
        assert.equal(jobName, 'a');
        assert.equal(status, 'SUCCESS');
      },
      stopBuild: () => {
        assert.ok(false);
      }
    });

    assert.expect(3);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    this.$('.actions span')[0].click();
  });

  test('start build from latest build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'RUNNING'
      },
      startSingleBuild: (jobId, jobName, status) => {
        assert.equal(jobId, 1);
        assert.equal(jobName, 'a');
        assert.equal(status, undefined);
      },
      stopBuild: () => {
        assert.ok(false);
      }
    });

    assert.expect(3);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    this.$('.actions span')[2].click();
  });

  test('stop build', async function(assert) {
    set(this, 'value', {
      jobId: 1,
      jobName: 'a',
      latestBuild: {
        id: 2,
        status: 'RUNNING'
      },
      startSingleBuild: () => {
        assert.ok(false);
      },
      stopBuild: () => {
        assert.ok(true);
      }
    });

    assert.expect(1);

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    this.$('.actions span')[1].click();
  });
});
