import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/jobs/table/cell/job',
  function (hooks) {
    setupRenderingTest(hooks);

    const job = { id: 123, name: 'main', pipelineId: 987 };
    const jobName = 'main';

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          job,
          jobName
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Job
            @record={{this.record}}
        />`
      );

      assert.dom('.job-status a').doesNotExist();
      assert.dom('.job-name').hasText(jobName);
    });

    test('it renders with status icon', async function (assert) {
      this.setProperties({
        record: {
          job,
          jobName,
          build: {
            id: 999,
            status: 'SUCCESS'
          }
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Job
            @record={{this.record}}
        />`
      );

      assert.dom('.job-status a').exists({ count: 1 });
      assert.dom('.job-name').hasText(jobName);
    });
  }
);
