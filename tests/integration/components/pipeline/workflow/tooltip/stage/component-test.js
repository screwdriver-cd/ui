import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/workflow/tooltip/stage',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders an empty stage tooltip', async function (assert) {
      const router = this.owner.lookup('service:router');

      sinon.stub(router, 'currentRoute').value({
        name: 'pulls'
      });

      this.setProperties({
        d3Data: {
          d3Event: { target: null },
          stage: {
            setup: {
              name: 'setup'
            }
          }
        },
        event: {},
        jobs: [],
        builds: [],
        workflowGraph: {
          nodes: [],
          edges: []
        }
      });

      await render(
        hbs`<Pipeline::Workflow::Tooltip::Stage
            @d3Data={{this.d3Data}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @workflowGraph={{this.workflowGraph}}
        />`
      );

      assert.dom('#start-job-link').doesNotExist();
      assert.dom('#workflow-graph-tooltip').exists();
      assert.dom('#workflow-graph-tooltip').hasText('Can not start stage');
    });

    test('it renders an stage tooltip to start', async function (assert) {
      const router = this.owner.lookup('service:router');

      sinon.stub(router, 'currentRoute').value({
        name: 'events'
      });

      this.setProperties({
        d3Data: {
          d3Event: { target: null },
          stage: {
            setup: {
              name: 'setup'
            }
          }
        },
        event: {},
        jobs: [],
        builds: [],
        workflowGraph: {
          nodes: [],
          edges: []
        }
      });

      await render(
        hbs`<Pipeline::Workflow::Tooltip::Stage
            @d3Data={{this.d3Data}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @workflowGraph={{this.workflowGraph}}
        />`
      );

      assert.dom('#start-job-link').exists();
      assert.dom('#start-job-link').hasText('Start pipeline from this stage');
    });

    test('it renders an stage tooltip to start', async function (assert) {
      const router = this.owner.lookup('service:router');

      sinon.stub(router, 'currentRoute').value({
        name: 'events'
      });

      this.setProperties({
        d3Data: {
          d3Event: { target: null },
          stage: {
            setup: {
              id: 123,
              name: 'setup'
            }
          }
        },
        event: {},
        jobs: [],
        builds: [{ jobId: 123, status: 'SUCCESS' }],
        workflowGraph: {
          nodes: [],
          edges: []
        }
      });

      await render(
        hbs`<Pipeline::Workflow::Tooltip::Stage
            @d3Data={{this.d3Data}}
            @event={{this.event}}
            @jobs={{this.jobs}}
            @builds={{this.builds}}
            @workflowGraph={{this.workflowGraph}}
        />`
      );

      assert.dom('#start-job-link').exists();
      assert.dom('#start-job-link').hasText('Restart pipeline from this stage');
    });
  }
);
