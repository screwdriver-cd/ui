import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';

module('Integration | Component | pipeline list view', function (hooks) {
  setupRenderingTest(hooks);

  const PIPELINE = {
    state: 'ACTIVE'
  };

  test('it renders', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'RUNNING',
            startTime: '',
            endTime: ''
          },
          {
            id: 2,
            jobId: 1,
            status: 'RUNNING',
            startTime: '',
            endTime: ''
          }
        ]
      },
      {
        jobId: 2,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 2,
            status: 'ABORTED',
            startTime: '',
            endTime: ''
          },
          {
            id: 2,
            jobId: 2,
            status: 'RUNNING',
            startTime: '',
            endTime: ''
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);
    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 2 });
  });

  test('it renders then resets jobDetails', async function (assert) {
    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'RUNNING',
            startTime: '',
            endTime: ''
          },
          {
            id: 2,
            jobId: 1,
            status: 'RUNNING',
            startTime: '',
            endTime: ''
          }
        ]
      },
      {
        jobId: 2,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 2,
            status: 'ABORTED',
            startTime: '',
            endTime: ''
          },
          {
            id: 2,
            jobId: 2,
            status: 'RUNNING',
            startTime: '',
            endTime: ''
          }
        ]
      }
    ]);
    set(this, 'updateListViewJobs', () => Promise.resolve([]));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', [{ p1: 'p1' }]);
    set(this, 'showPipelineListView', true);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`
      {{#if this.showPipelineListView}}
        <PipelineListView
          @pipeline={{this.pipeline}}
          @jobsDetails={{this.jobsDetails}}
          @updateListViewJobs={{this.updateListViewJobs}}
          @refreshListViewJobs={{this.refreshListViewJobs}}
          @startSingleBuild={{this.startSingleBuild}}
          @stopBuild={{this.stopBuild}}
          @buildParameters={{this.buildParameters}}
          @showListView={{this.showListView}}
          @setShowListView={{this.setShowListView}}
        />

      {{/if}}`);
    set(this, 'showPipelineListView', false);

    return settled().then(() => {
      assert.equal(this.jobsDetails.length, 0);
    });
  });

  test('it renders with duration', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'RUNNING',
            startTime: '2020-04-16T01:30:01.447',
            endTime: '2020-04-16T07:43:09.447'
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);

    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(Date, 'prototype.getTimezoneOffset', () => 0);
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');

    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').includesText('6h 13m 8s');
    assert.dom('tbody tr').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build running', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'RUNNING',
            startTime: '2020-04-16T01:30:01.447',
            endTime: null
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);

    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').includesText('Still running.');
    assert.dom('tbody tr').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build created', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'CREATED',
            startTime: '2020-04-16T01:30:01.447',
            endTime: null
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);

    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').includesText('Still running.');
    assert.dom('tbody tr').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build queued', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'QUEUED',
            startTime: '2020-04-16T01:30:01.447',
            endTime: null
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);

    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').includesText('Still running.');
    assert.dom('tbody tr').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build blocked', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'BLOCKED',
            startTime: '2020-04-16T01:30:01.447',
            endTime: null
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);

    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').includesText('Still running.');
    assert.dom('tbody tr').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build frozen', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'FROZEN',
            startTime: '2020-04-16T01:30:01.447',
            endTime: null
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);

    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').includesText('Still running.');
    assert.dom('tbody tr').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and not started', async function (assert) {
    const jobs = [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'RUNNING',
            startTime: null,
            endTime: null
          }
        ]
      }
    ];

    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', jobs);

    set(this, 'updateListViewJobs', () => Promise.resolve(jobs));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').includesText('Not started.');
  });

  test('it renders and aborted', async function (assert) {
    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', [
      {
        jobId: 1,
        jobName: 'a',
        builds: [
          {
            id: 1,
            jobId: 1,
            status: 'ABORTED',
            startTime: '2020-04-16T01:30:01.447',
            endTime: null
          }
        ]
      }
    ]);
    set(this, 'updateListViewJobs', () => Promise.resolve([]));
    set(this, 'refreshListViewJobs', () => {
      assert.ok(true);
    });
    set(this, 'startSingleBuild', () => {
      assert.ok(true);
    });
    set(this, 'stopBuild', () => {
      assert.ok(true);
    });
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineListView
      @pipeline={{this.pipeline}}
      @jobsDetails={{this.jobsDetails}}
      @updateListViewJobs={{this.updateListViewJobs}}
      @refreshListViewJobs={{this.refreshListViewJobs}}
      @startSingleBuild={{this.startSingleBuild}}
      @stopBuild={{this.stopBuild}}
      @buildParameters={{this.buildParameters}}
      @showListView={{this.showListView}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('tbody').exists({ count: 1 });
    assert.dom('th.table-header').exists({ count: 7 });
    assert
      .dom('thead')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('tbody tr').exists({ count: 1 });
    assert.dom('tbody tr').doesNotIncludeText('Still running.');
  });
});
