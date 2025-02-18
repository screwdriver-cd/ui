import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/workflow', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(workflowDataReload, 'start').callsFake(() => {});

    const pipelineId = 1234;

    sinon.stub(pipelinePageState, 'getPipeline').returns({ id: pipelineId });
    sinon.stub(pipelinePageState, 'getPipelineId').returns(pipelineId);
  });

  test('it renders for pipeline with no events', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentRouteName').value('events');

    this.setProperties({
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Workflow
        @userSettings={{this.userSettings}}
        @noEvents={{true}}
      />`
    );

    assert.dom('#event-rail').exists({ count: 1 });
    assert.dom('#workflow-display-container').doesNotExist();
    assert.dom('#no-events').exists({ count: 1 });
    assert.dom('#no-events').hasText('This pipeline has no events yet');
    assert.dom('#invalid-event').doesNotExist();
  });

  test('it renders for pipeline with no PRs', async function (assert) {
    const router = this.owner.lookup('service:router');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(router, 'currentRouteName').value('pulls');
    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    this.setProperties({
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Workflow
        @userSettings={{this.userSettings}}
        @noEvents={{true}}
      />`
    );

    assert.dom('#event-rail').exists({ count: 1 });
    assert.dom('#workflow-display-container').doesNotExist();
    assert.dom('#no-events').exists({ count: 1 });
    assert
      .dom('#no-events')
      .hasText('This pipeline has no open pull requests yet');
    assert.dom('#invalid-event').doesNotExist();
  });

  test('it renders for pipeline with invalid event', async function (assert) {
    const router = this.owner.lookup('service:router');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(router, 'currentRouteName').value('events');
    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    this.setProperties({
      userSettings: {},
      jobs: [],
      stages: [],
      triggers: [],
      latestEvent: {
        id: 123,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      }
    });

    await render(
      hbs`<Pipeline::Workflow
        @userSettings={{this.userSettings}}
        @jobs={{this.jobs}}
        @stages={{this.stages}}
        @triggers={{this.triggers}}
        @latestEvent={{this.latestCommitEvent}}
        @invalidEvent={{true}}
      />`
    );

    assert.dom('#event-rail').exists({ count: 1 });
    assert.dom('#workflow-display-container').doesNotExist();
    assert.dom('#no-events').doesNotExist();
    assert.dom('#invalid-event').exists({ count: 1 });
    assert
      .dom('#invalid-event')
      .hasText('Event does not exist for this pipeline');
  });

  test('it renders for pipeline with invalid pull request', async function (assert) {
    const router = this.owner.lookup('service:router');
    const shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(router, 'currentRouteName').value('pulls');
    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/pulls/11');
    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    this.setProperties({
      userSettings: {},
      jobs: [],
      stages: [],
      triggers: []
    });

    await render(
      hbs`<Pipeline::Workflow
        @userSettings={{this.userSettings}}
        @jobs={{this.jobs}}
        @stages={{this.stages}}
        @triggers={{this.triggers}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @invalidEvent={{true}}
      />`
    );

    assert.dom('#event-rail').exists({ count: 1 });
    assert.dom('#workflow-display-container').doesNotExist();
    assert.dom('#no-events').doesNotExist();
    assert.dom('#invalid-event').exists({ count: 1 });
    assert
      .dom('#invalid-event')
      .hasText('Pull request does not exist for this pipeline');
  });

  test('it renders for pipeline with event', async function (assert) {
    const router = this.owner.lookup('service:router');
    const shuttle = this.owner.lookup('service:shuttle');
    const eventId = 123;

    sinon.stub(router, 'currentRouteName').value('events');
    sinon.stub(router, 'currentURL').value(`/v2/pipelines/1/events/${eventId}`);
    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    const event = {
      id: eventId,
      sha: 'abc123def456',
      commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
      creator: { name: 'batman' },
      meta: {},
      workflowGraph: {
        nodes: [{ name: '~commit' }, { name: 'main' }],
        edges: [{ src: '~commit', dest: 'main' }]
      }
    };

    this.setProperties({
      userSettings: {},
      jobs: [],
      stages: [],
      triggers: [],
      latestEvent: event,
      event
    });

    await render(
      hbs`<Pipeline::Workflow
        @userSettings={{this.userSettings}}
        @jobs={{this.jobs}}
        @stages={{this.stages}}
        @triggers={{this.triggers}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @event={{this.event}}
      />`
    );

    assert.dom('#event-rail').exists({ count: 1 });
    assert.dom('#workflow-display-container').exists({ count: 1 });
    assert.dom('#no-events').doesNotExist();
    assert.dom('#invalid-event').doesNotExist();
  });

  test('it renders for pipeline with pull request', async function (assert) {
    const router = this.owner.lookup('service:router');
    const shuttle = this.owner.lookup('service:shuttle');
    const eventId = 123;
    const prNum = 4;

    sinon.stub(router, 'currentRouteName').value('pulls');
    sinon.stub(router, 'currentURL').value(`/v2/pipelines/1/pulls/${prNum}`);
    sinon.stub(shuttle, 'fetchFromApi').resolves([]);

    const event = {
      id: eventId,
      sha: 'abc123def456',
      commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
      creator: { name: 'batman' },
      meta: {},
      workflowGraph: {
        nodes: [{ name: '~commit' }, { name: 'main' }],
        edges: [{ src: '~commit', dest: 'main' }]
      },
      type: 'pr',
      prNum
    };

    this.setProperties({
      userSettings: {},
      jobs: [],
      stages: [],
      triggers: [],
      latestEvent: event,
      event,
      prNums: []
    });

    await render(
      hbs`<Pipeline::Workflow
        @userSettings={{this.userSettings}}
        @jobs={{this.jobs}}
        @stages={{this.stages}}
        @triggers={{this.triggers}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @event={{this.event}}
        @prNums={{this.prNums}}
      />`
    );

    assert.dom('#event-rail').exists({ count: 1 });
    assert.dom('#workflow-display-container').exists({ count: 1 });
    assert.dom('#no-events').doesNotExist();
    assert.dom('#invalid-event').doesNotExist();
  });
});
