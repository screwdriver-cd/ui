import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

const mockPipeline = EmberObject.create({
  id: 1
});

module('Integration | Component | pipeline list job cell', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.setProperties({
      pipeline: mockPipeline
    });
  });

  test('it renders running build for normal job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'a',
        isVirtualJob: false,
        build: {
          id: 2,
          status: 'RUNNING'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-spinner').exists({ count: 1 });
    assert.dom('.job-name').hasText('a');
  });

  test('it renders running build for virtual job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'a',
        isVirtualJob: true,
        build: {
          id: 2,
          status: 'RUNNING'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-spinner').exists({ count: 1 });
    assert.dom('.job-name').hasText('a');
  });

  test('it renders an aborted build for normal job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'b',
        isVirtualJob: false,
        build: {
          id: 2,
          status: 'ABORTED'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-circle-stop').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders an aborted build for virtual job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'b',
        isVirtualJob: true,
        build: {
          id: 2,
          status: 'ABORTED'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-circle-stop').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders a successful build for normal job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'b',
        isVirtualJob: false,
        build: {
          id: 2,
          status: 'SUCCESS'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-circle-check').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders a successful build for virtual job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'b',
        isVirtualJob: true,
        build: {
          id: 2,
          status: 'SUCCESS'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-forward-fast').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders a failed build for normal job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'b',
        isVirtualJob: false,
        build: {
          id: 2,
          status: 'FAILURE'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-circle-xmark').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders a failed build for virtual job', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'b',
        isVirtualJob: true,
        build: {
          id: 2,
          status: 'FAILURE'
        }
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-forward-fast').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders displayName if present', async function (assert) {
    this.set('record', {
      job: {
        jobName: 'a',
        build: {
          id: 2,
          status: 'RUNNING'
        },
        displayName: 'dummyjob'
      }
    });

    await render(hbs`<PipelineListJobCell
      @record={{this.record}}
    />`);

    assert.dom('.fa-spinner').exists({ count: 1 });
    assert.dom('.job-name').hasText('dummyjob');
  });
});
