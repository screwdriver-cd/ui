import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module(
  'Integration | Component | workflow stage actions menu',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      await render(hbs`<WorkflowStageActionsMenu/>`);

      assert.dom('.content').exists({ count: 1 });

      // Template block usage:
      await render(hbs`
        <WorkflowStageActionsMenu/>
        "template block text"
      `);

      assert.dom(this.element).includesText('template block text');
    });

    test('it renders start link', async function (assert) {
      const data = {
        stage: {
          id: 1234,
          name: 'integration',
          setup: {
            id: 777,
            name: 'stage@integration:setup'
          }
        }
      };

      this.set('menuData', data);
      this.set('canRestartPipeline', true);
      this.set('canStageStartFromView', true);
      this.set('confirmStartBuild', () => {
        assert.ok(true);
      });

      await render(hbs`<WorkflowStageActionsMenu
        @menuData={{this.menuData}}
        @showMenu={{this.showMenu}}
        @canRestartPipeline={{this.canRestartPipeline}}
        @canStageStartFromView={{this.canStageStartFromView}}
        @confirmStartBuild={{this.confirmStartBuild}}
      />`);

      assert.dom('.content a').exists({ count: 1 });
      assert.dom('a:nth-of-type(1)').hasText('Start pipeline from this stage');
      await click('a:nth-of-type(1)');
    });

    test('it renders restart link', async function (assert) {
      const data = {
        stage: {
          id: 1234,
          name: 'integration',
          setup: {
            id: 777,
            name: 'stage@integration:setup'
          },
          status: 'RUNNING'
        }
      };

      this.set('menuData', data);
      this.set('canRestartPipeline', true);
      this.set('canStageStartFromView', true);
      this.set('confirmStartBuild', () => {
        assert.ok(true);
      });

      await render(hbs`<WorkflowStageActionsMenu
        @menuData={{this.menuData}}
        @showMenu={{this.showMenu}}
        @canRestartPipeline={{this.canRestartPipeline}}
        @canStageStartFromView={{this.canStageStartFromView}}
        @confirmStartBuild={{this.confirmStartBuild}}
      />`);

      assert.dom('.content a').exists({ count: 1 });
      assert
        .dom('a:nth-of-type(1)')
        .hasText('Restart pipeline from this stage');
      await click(findAll('.content a')[0]);
    });

    test('it hides start link when the user does not have permission', async function (assert) {
      const data = {
        stage: {
          id: 1234,
          name: 'integration',
          setup: {
            id: 777,
            name: 'stage@integration:setup'
          }
        }
      };

      this.set('menuData', data);
      this.set('canRestartPipeline', false);
      this.set('canStageStartFromView', true);
      this.set('confirmStartBuild', () => {});

      await render(hbs`<WorkflowStageActionsMenu
        @menuData={{this.menuData}}
        @showMenu={{this.showMenu}}
        @canRestartPipeline={{this.canRestartPipeline}}
        @canStageStartFromView={{this.canStageStartFromView}}
        @confirmStartBuild={{this.confirmStartBuild}}
      />`);

      assert.dom('.content a').doesNotExist();
    });

    test('it hides start link for PR event', async function (assert) {
      const data = {
        stage: {
          id: 1234,
          name: 'integration',
          setup: {
            id: 777,
            name: 'stage@integration:setup'
          }
        }
      };

      this.set('menuData', data);
      this.set('canRestartPipeline', true);
      this.set('canStageStartFromView', false);
      this.set('confirmStartBuild', () => {});

      await render(hbs`<WorkflowStageActionsMenu
        @menuData={{this.menuData}}
        @showMenu={{this.showMenu}}
        @canRestartPipeline={{this.canRestartPipeline}}
        @canStageStartFromView={{this.canStageStartFromView}}
        @confirmStartBuild={{this.confirmStartBuild}}
      />`);

      assert.dom('.content a').doesNotExist();
    });
  }
);
