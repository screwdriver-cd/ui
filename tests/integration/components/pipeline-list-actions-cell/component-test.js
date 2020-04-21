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

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').doesNotExist();
  });

  test('it renders with stopBuild disabled', async function(assert) {
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

    await render(hbs`{{pipeline-list-actions-cell
      value=value
    }}`);

    assert.dom('.fa-play-circle-o').exists({ count: 1 });
    assert.dom('.fa-stop-circle-o').exists({ count: 1 });
    assert.dom('.fa-repeat').exists({ count: 1 });
    assert.dom('.clicks-disabled').exists({ count: 1 });
  });
});
