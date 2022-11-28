import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';
import wait from 'ember-test-helpers/wait';

module('Integration | Component | pipeline list view', function (hooks) {
  setupRenderingTest(hooks);

  const PIPELINE = {
    state: 'ACTIVE'
  };

  test('it renders', async function (assert) {
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
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 2 });
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
      {{#if showPipelineListView}}
        {{pipeline-list-view
          pipeline=pipeline
          jobsDetails=jobsDetails
          updateListViewJobs=updateListViewJobs
          refreshListViewJobs=refreshListViewJobs
          startSingleBuild=startSingleBuild
          stopBuild=stopBuild
          buildParameters=buildParameters
          showListView=showListView
          setShowListView=setShowListView
        }}
      {{/if}}`);
    set(this, 'showPipelineListView', false);

    return wait().then(() => {
      assert.equal(this.get('jobsDetails').length, 0);
    });
  });

  test('it renders with duration', async function (assert) {
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
            startTime: '2020-04-16T01:30:01.447',
            endTime: '2020-04-16T07:43:09.447'
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
    set(Date, 'prototype.getTimezoneOffset', () => 0);
    set(this, 'buildParameters', []);
    set(this, 'showListView', true);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').includesText('6h 13m 8s');
    assert.dom('.lt-body').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build running', async function (assert) {
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

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').includesText('Still running.');
    assert.dom('.lt-body').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build created', async function (assert) {
    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', [
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

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').includesText('Still running.');
    assert.dom('.lt-body').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build queued', async function (assert) {
    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', [
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

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').includesText('Still running.');
    assert.dom('.lt-body').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build blocked', async function (assert) {
    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', [
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

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').includesText('Still running.');
    assert.dom('.lt-body').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and build frozen', async function (assert) {
    set(this, 'pipeline', PIPELINE);
    set(this, 'jobsDetails', [
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

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').includesText('Still running.');
    assert.dom('.lt-body').includesText('04/16/2020, 01:30 AM');
  });

  test('it renders and not started', async function (assert) {
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
            startTime: null,
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

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').includesText('Not started.');
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

    await render(hbs`{{pipeline-list-view
      pipeline=pipeline
      jobsDetails=jobsDetails
      updateListViewJobs=updateListViewJobs
      refreshListViewJobs=refreshListViewJobs
      startSingleBuild=startSingleBuild
      stopBuild=stopBuild
      buildParameters=buildParameters
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.dom('.lt-head-wrap').exists({ count: 1 });
    assert.dom('.lt-body-wrap').exists({ count: 1 });
    assert.dom('.lt-column').exists({ count: 7 });
    assert
      .dom('.lt-head')
      .hasText('JOB HISTORY DURATION START TIME COVERAGE METRICS ACTIONS');
    assert.dom('.lt-row').exists({ count: 1 });
    assert.dom('.lt-body').doesNotIncludeText('Still running.');
  });
});
