import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/workflow/tooltip/stage',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      this.owner
        .lookup('service:pipeline-page-state')
        .setPipeline({ id: 123, state: 'ACTIVE' });
    });

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
            @builds={{this.builds}}
            @workflowGraph={{this.workflowGraph}}
        />`
      );

      assert.dom('#start-stage-link').doesNotExist();
      assert.dom('#restart-stage-link').doesNotExist();
      assert.dom('#workflow-graph-tooltip').exists();
      assert
        .dom('#workflow-graph-tooltip')
        .hasText('Can not run at this stage');
    });

    test('it renders an stage tooltip', async function (assert) {
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
        event: { sha: '1234567890abcdefg' },
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
            @builds={{this.builds}}
            @workflowGraph={{this.workflowGraph}}
        />`
      );

      assert.dom('#run-stage-label').hasText('Run stage at #1234567');
      assert.dom('#start-stage-link').hasText('New Run (Fresh)');
      assert.dom('#restart-stage-link').hasText('Restart (Inherit)');
    });

    test('it renders disabled manually starting', async function (assert) {
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
            },
            manualStartDisabled: true
          }
        },
        event: {},
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
            @builds={{this.builds}}
            @workflowGraph={{this.workflowGraph}}
        />`
      );

      assert.dom('p').hasText('Disabled manually starting by annotation');
    });

    test('it does not render stage actions for a disabled pipeline', async function (assert) {
      const router = this.owner.lookup('service:router');
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(router, 'currentRoute').value({
        name: 'events'
      });
      pipelinePageState.setPipeline({ id: 123, state: 'DISABLED' });

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
            @builds={{this.builds}}
            @workflowGraph={{this.workflowGraph}}
        />`
      );

      assert.dom('#start-stage-link').doesNotExist();
      assert.dom('#restart-stage-link').doesNotExist();
      assert
        .dom('#workflow-graph-tooltip')
        .hasText('Can not start/restart stage');
    });
  }
);
