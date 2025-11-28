import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | workflow tooltip', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(hbs`<WorkflowTooltip/>`);

    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');

    // Template block usage:
    await render(hbs`
        <WorkflowTooltip/>
        "template block text"
      `);

    assert.dom(this.element).includesText('template block text');
  });

  test('it renders build detail and metrics links', async function (assert) {
    const data = {
      job: {
        id: 1,
        buildId: 1234,
        name: 'batmobile',
        isDisabled: false
      }
    };

    this.set('data', data);

    await render(hbs`<WorkflowTooltip @tooltipData={{this.data}} />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Disable this job');
  });

  test('it renders disabled build detail link', async function (assert) {
    await render(hbs`<WorkflowTooltip />`);

    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(1)').hasClass('disabled');

    let data = {
      job: {
        id: 1,
        buildId: 1234,
        name: 'batmobile',
        status: 'CREATED',
        isDisabled: false
      }
    };

    this.set('data', data);
    await render(hbs`<WorkflowTooltip @tooltipData={{this.data}} />`);

    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(1)').hasClass('disabled');

    data = {
      job: {
        id: 1,
        name: 'batmobile',
        isDisabled: false
      }
    };

    this.set('data', data);
    await render(hbs`<WorkflowTooltip @tooltipData={{this.data}} />`);

    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(1)').hasClass('disabled');
  });

  test('it renders remote trigger link', async function (assert) {
    const data = {
      externalTrigger: {
        pipelineId: 1234,
        jobName: 'main'
      }
    };

    this.set('data', data);

    await render(hbs`<WorkflowTooltip @tooltipData={{this.data}} />`);

    assert.dom('.content a').exists({ count: 1 });
    assert.dom(this.element).hasText('Go to remote pipeline');
  });

  test('it renders downstream trigger links', async function (assert) {
    const data = {
      triggers: [
        {
          pipelineId: 1234,
          jobName: 'main',
          triggerName: '~sd@1234:main'
        },
        {
          pipelineId: 2,
          jobName: 'prod',
          triggerName: '~sd@2:prod'
        }
      ]
    };

    this.set('data', data);

    await render(hbs`<WorkflowTooltip @tooltipData={{this.data}} />`);

    assert.dom('.content a').exists({ count: 2 });
    assert
      .dom(this.element)
      .hasText(
        'Go to downstream pipeline ~sd@1234:main Go to downstream pipeline ~sd@2:prod'
      );
  });

  test('it renders disabled manually starting', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        manualStartDisabled: true,
        isDisabled: false
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
      />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('.content p').exists({ count: 1 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Disable this job');
    assert.dom('p:nth-of-type(1)').hasText('Disabled manually starting');
  });

  test('it renders start link', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        isDisabled: false
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 4 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Start pipeline from here');
    assert.dom('a:nth-of-type(4)').hasText('Disable this job');
  });

  test('it renders restart link', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        status: 'SUCCESS',
        isDisabled: false
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 4 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Restart pipeline from here');
    assert.dom('a:nth-of-type(4)').hasText('Disable this job');
  });

  test('it renders disable link', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        isDisabled: false
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 4 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Start pipeline from here');
    assert.dom('a:nth-of-type(4)').hasText('Disable this job');
  });

  test('it renders enable link', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        status: 'DISABLED',
        isDisabled: true
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', false);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Enable this job');
  });

  test('it hides restart link if no build exists in PRChain', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        status: 'SUCCESS',
        isDisabled: false
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', false);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Disable this job');
  });

  test('it renders start link for stage jobs', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        isDisabled: false,
        stageName: 'integration'
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 4 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Start pipeline from here');
    assert.dom('a:nth-of-type(4)').hasText('Disable this job');
  });

  test('it renders restart link for stage jobs', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        status: 'SUCCESS',
        isDisabled: false,
        stageName: 'integration'
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 4 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Restart pipeline from here');
    assert.dom('a:nth-of-type(4)').hasText('Disable this job');
  });

  test('it renders stop frozen build link', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        status: 'FROZEN',
        isDisabled: false
      },
      selectedEvent: 'Stop frozen build'
    };

    this.set('data', data);
    this.set('stopBuild', () => {});
    this.set('action', () => {});

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @stopBuild={{this.stopBuild}}
        @action={{this.action}}
      />`);

    assert.dom('.content a').exists({ count: 4 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Disable this job');
    assert.dom('a:nth-of-type(4)').hasText('Stop frozen build');
  });

  test('it shows restart link if build exists in PRChain', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        status: 'SUCCESS',
        isDisabled: false
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 4 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Restart pipeline from here');
    assert.dom('a:nth-of-type(4)').hasText('Disable this job');
  });

  test('it should update position and hidden status', async function (assert) {
    this.set('show', true);
    this.set('pos', 'left');

    await render(hbs`<WorkflowTooltip
        @showTooltip={{this.show}}
        @showTooltipPosition={{this.pos}}
      />`);

    assert.dom('.workflow-tooltip').hasClass('show-tooltip');
    assert.dom('.workflow-tooltip').hasClass('left');

    this.set('show', false);
    this.set('pos', 'center');

    assert.dom('.workflow-tooltip').hasNoClass('show-tooltip');
    assert.dom('.workflow-tooltip').hasNoClass('left');
  });

  test('it shows job toggle modal when click disable link', async function (assert) {
    const data = {
      job: {
        id: 1,
        buildId: 1234,
        name: 'batmobile',
        isDisabled: false
      }
    };

    const pipelineMock = EmberObject.create({
      jobs: [
        {
          id: 1,
          name: 'batmobile'
        },
        {
          id: 2,
          name: 'foo'
        }
      ]
    });

    this.set('data', data);
    this.set('pipeline', pipelineMock);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @pipeline={{this.pipeline}}
      />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:nth-of-type(3)').hasText('Disable this job');

    await click('a:nth-of-type(3)');

    assert.dom('.toggle-modal').exists({ count: 1 });
    assert.dom('.modal-title').hasText('Disable the "batmobile" job?');
  });

  test('it shows job toggle modal when click enable link', async function (assert) {
    const data = {
      job: {
        id: 1,
        buildId: 1234,
        name: 'batmobile',
        isDisabled: true
      }
    };

    const pipelineMock = EmberObject.create({
      jobs: [
        {
          id: 1,
          name: 'batmobile'
        },
        {
          id: 2,
          name: 'foo'
        }
      ]
    });

    this.set('data', data);
    this.set('pipeline', pipelineMock);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @pipeline={{this.pipeline}}
      />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:nth-of-type(3)').hasText('Enable this job');

    await click('a:nth-of-type(3)');

    assert.dom('.toggle-modal').exists({ count: 1 });
    assert.dom('.modal-title').hasText('Enable the "batmobile" job?');
  });

  test('it renders short description', async function (assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        description: 'Test'
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Start pipeline from here');
    assert.dom('span').hasText('Test');
  });

  test('it renders long description', async function (assert) {
    const fullDescription =
      '123456789,123456789,123456789,123456789,123456789,';
    const description = '123456789,123456789,12345...';

    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile',
        description: fullDescription
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);
    this.set('enableHiddenDescription', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
        @enableHiddenDescription={{this.enableHiddenDescription}}
      />`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:nth-of-type(1)').hasText('Go to build details');
    assert.dom('a:nth-of-type(2)').hasText('Go to build metrics');
    assert.dom('a:nth-of-type(3)').hasText('Start pipeline from here');
    assert.dom('span').hasText(`${description}`);

    await click('span');

    assert.dom('span').hasText(`${fullDescription}`);
  });

  test('it does not render actionable menu options when the node represents stage jobs group', async function (assert) {
    const data = {
      job: {
        name: 'stage@production jobs(3)',
        description:
          'This job group includes the following jobs: prod-deploy, prod-test, prod-certify',
        type: 'JOB_GROUP'
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});
    this.set('canJobStartFromView', true);

    await render(hbs`<WorkflowTooltip
        @tooltipData={{this.data}}
        @canRestartPipeline={{true}}
        @confirmStartBuild={{this.confirmStartBuild}}
        @canJobStartFromView={{this.canJobStartFromView}}
      />`);

    assert.dom('.content a').doesNotExist();
    assert.dom('.content span').exists({ count: 1 });
    assert
      .dom('.content span')
      .hasText(
        'Description: This job group includes the following jobs: prod-deploy, prod-test, prod-certify'
      );
  });
});
