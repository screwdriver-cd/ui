import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { authenticateSession } from 'ember-simple-auth/test-support';
import sinon from 'sinon';

module('Integration | Component | pipeline/workflow/tooltip', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon
      .stub(pipelinePageState, 'getPipeline')
      .returns({ id: 987, state: 'ACTIVE' });
  });

  test('it renders build detail and metrics links', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'main'
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#remote-pipeline-link').doesNotExist();
    assert.dom('.downstream-pipeline-link').doesNotExist();
    assert.dom('#build-link').exists({ count: 1 });
    assert.dom('#metrics-link').exists({ count: 1 });
  });

  test('it renders external trigger link', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: '~sd@1234:main'
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#remote-pipeline-link').exists({ count: 1 });
  });

  test('it renders downstream trigger links', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: '~sd-cool-triggers',
          triggers: ['~sd@1234:main', '~sd@9876:build']
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('.downstream-pipeline-link').exists({ count: 2 });
  });

  test('it renders enable build detail link', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'main',
          isDisabled: true
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#toggle-job-link').exists({ count: 1 });
    assert.dom('#toggle-job-link').hasText('Enable this job');
  });

  test('it renders disable build link', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'main',
          isDisabled: false
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#toggle-job-link').exists({ count: 1 });
    assert.dom('#toggle-job-link').hasText('Disable this job');
  });

  test('it renders disabled manually starting', async function (assert) {
    authenticateSession();

    this.setProperties({
      d3Data: {
        node: {
          name: 'main',
          manualStartDisabled: true
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#toggle-job-link').doesNotExist();
    assert.dom('p').hasText('Disabled manually starting');
  });

  test('it renders stop build link', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'main',
          status: 'RUNNING'
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#stop-build-link').exists({ count: 1 });
  });

  test('it renders stop frozen build link', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'main',
          status: 'FROZEN'
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#stop-build-link').exists({ count: 1 });
  });

  test('it renders job description', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'main',
          description: 'testing'
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#tooltip-description').exists({ count: 1 });
  });

  test('it renders job hidden description', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'main',
          description: 'Some really long description that should be truncated'
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#hidden-tooltip-description').exists({ count: 1 });
  });

  test('it does not render actionable menu options when the node represents stage jobs group', async function (assert) {
    this.setProperties({
      d3Data: {
        node: {
          name: 'stage@production jobs(3)',
          description:
            'This job group includes the following jobs: prod-deploy, prod-test, prod-certify',
          type: 'JOB_GROUP'
        },
        d3Event: { clientX: 0, clientY: 0 },
        sizes: { ICON_SIZE: 0 }
      },
      event: {},
      jobs: [],
      builds: []
    });

    await render(
      hbs`<Pipeline::Workflow::Tooltip
        @d3Data={{this.d3Data}}
        @event={{this.event}}
        @jobs={{this.jobs}}
        @builds={{this.builds}}
      />`
    );

    assert.dom('#remote-pipeline-link').doesNotExist();
    assert.dom('.downstream-pipeline-link').doesNotExist();
    assert.dom('#build-link').doesNotExist();
    assert.dom('#metrics-link').doesNotExist();
    assert.dom('#toggle-job-link').doesNotExist();
    assert.dom('#stop-build-link').doesNotExist();

    assert.dom('#hidden-tooltip-description').exists({ count: 1 });
    assert
      .dom('#hidden-tooltip-description')
      .hasText('Description: This job group includes t...');
  });
});
