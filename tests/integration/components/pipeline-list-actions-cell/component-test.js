import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';

module(
  'Integration | Component | pipeline list actions cell',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      assert.expect(4);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').doesNotExist();
    });

    test('it renders queued build', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      assert.expect(4);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').doesNotExist();
    });

    test('it renders blocked build', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      assert.expect(4);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').doesNotExist();
    });

    test('it renders frozen build', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.expect(4);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').doesNotExist();
    });

    test('it renders created build', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      assert.expect(4);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').doesNotExist();
    });

    test('it renders with aborted build', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      assert.expect(4);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').exists({ count: 1 });
    });

    test('it renders with successful build', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      assert.expect(4);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').exists({ count: 1 });
    });

    test('it renders with annotation manualStartEnabled: false', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: false
        }
      });

      assert.expect(4);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle-play').exists({ count: 1 });
      assert.dom('.fa-circle-stop').exists({ count: 1 });
      assert.dom('.fa-rotate-right').exists({ count: 1 });
      assert.dom('.clicks-disabled').exists({ count: 3 });
    });

    test('start build a new build', async function (assert) {
      set(this, 'record', {
        actions: {
          jobId: 1,
          jobName: 'a',
          latestBuild: {
            id: 2,
            status: 'RUNNING'
          },
          startSingleBuild: (jobId, jobName, status) => {
            assert.equal(jobId, 1);
            assert.equal(jobName, 'a');
            assert.equal(status, 'START');
          },
          stopBuild: () => {
            assert.ok(false);
          },
          manualStartEnabled: true
        }
      });

      assert.expect(3);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      this.element.querySelectorAll('.actions span')[0].click();
    });

    test('start build from latest build', async function (assert) {
      set(this, 'record', {
        actions: {
          jobId: 1,
          jobName: 'a',
          latestBuild: {
            id: 2,
            status: 'RUNNING'
          },
          startSingleBuild: (jobId, jobName, status) => {
            assert.equal(jobId, 1);
            assert.equal(jobName, 'a');
            assert.equal(status, 'RESTART');
          },
          stopBuild: () => {
            assert.ok(false);
          },
          manualStartEnabled: true
        }
      });

      assert.expect(3);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      this.element.querySelectorAll('.actions span')[2].click();
    });

    test('stop build', async function (assert) {
      set(this, 'record', {
        actions: {
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
          },
          manualStartEnabled: true
        }
      });

      assert.expect(1);

      await render(hbs`<PipelineListActionsCell
        @record={{this.record}}
      />`);

      this.element.querySelectorAll('.actions span')[1].click();
    });
  }
);
