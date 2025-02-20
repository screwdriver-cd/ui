import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, rerender } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/event/card', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders title when event is first in group', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card').hasAttribute('title', 'Event: 11');
  });

  test('it renders title when event is in group', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 3,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card').hasAttribute('title', `Event: 11\nGroup: 3`);
  });

  test('it renders core elements', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.highlighted').exists({ count: 1 });
    assert.dom('.event-card-title .event-status').exists({ count: 1 });
    assert.dom('.event-card-title .event-status').hasClass('SUCCESS');
    assert.dom('.event-card-title .event-status svg').exists({ count: 1 });
    assert.dom('.event-card-title pr-title').doesNotExist();
    assert.dom('.event-card-title .sha').exists({ count: 1 });
    assert.dom('.event-card-title .start-event-button').doesNotExist();

    assert.dom('.event-card-body').exists({ count: 1 });
    assert.dom('.event-card-body .message').exists({ count: 1 });
    assert.dom('.event-card-body .label').doesNotExist();
    assert.dom('.event-card-body .by').exists({ count: 1 });
    assert.dom('.event-card-body .time').exists({ count: 1 });

    assert.dom('.event-card-footer .counts').exists({ count: 1 });
    assert.dom('.event-card-footer .event-buttons').exists({ count: 1 });
    assert
      .dom('.event-card-footer .event-buttons .parameters-button')
      .doesNotExist();
    assert
      .dom('.event-card-footer .event-buttons .event-group-button')
      .doesNotExist();
  });

  test('it does not render highlight', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/99');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @builds={{this.builds}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.highlighted').doesNotExist();
  });

  test('it renders event label', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: { label: 'Testing 123' }
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-body .label').exists({ count: 1 });
  });

  test('it renders button for parameters', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {
          parameters: {
            foo: { value: 'bar' }
          }
        }
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
        @showParameters={{true}}
      />`
    );

    assert
      .dom('.event-card-footer .event-buttons .parameters-button')
      .exists({ count: 1 });
  });

  test('it renders button for event group', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {
          parameters: {
            foo: { value: 'bar' }
          }
        }
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
        @showEventGroup={{true}}
      />`
    );

    assert
      .dom('.event-card-footer .event-buttons .event-group-button')
      .exists({ count: 1 });
  });

  test('it renders abort button for running event', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'RUNNING' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
        @allowEventAction={{true}}
      />`
    );

    assert.dom('.event-card-title .abort-event-button').exists({ count: 1 });
  });

  test('it renders latest commit badge', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );
    const latestCommitSha = 'abc123def456';

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake((queueName, id, callback) => {
        callback({ sha: latestCommitSha });
      });
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: latestCommitSha,
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .sha .latest-commit').exists({ count: 1 });
    assert.dom('.event-card-title .sha .latest-commit').hasText('#abc123d');
  });

  test('it does not render counts for collapsed event', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'COLLAPSED' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-footer .counts .count').doesNotExist();
  });

  test('it renders count values', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([
          { status: 'SUCCESS' },
          { status: 'UNSTABLE' },
          { status: 'SUCCESS' },
          { status: 'FAILURE' }
        ]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-footer .counts .failures').exists({ count: 1 });
    assert.dom('.event-card-footer .counts .warnings').exists({ count: 1 });
    assert.dom('.event-card-footer .counts .successes').exists({ count: 1 });
  });

  test('it re-renders correctly when event changes', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .onCall(0)
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      })
      .onCall(1)
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'FAILURE' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .event-status').hasClass('SUCCESS');
    assert.dom('.event-card-title .sha').hasText('#abc123d');

    this.setProperties({
      event: {
        id: 12,
        sha: 'deadbeef123',
        commit: { author: { name: 'robin' }, message: 'New change' },
        creator: { name: 'robin' },
        meta: {}
      }
    });

    await rerender();

    assert.dom('.event-card-title .event-status').hasClass('FAILURE');
    assert.dom('.event-card-title .sha').hasText('#deadbee');
  });

  test('it renders latest commit badge', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );
    const latestCommitSha = 'abc123def456';

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake((queueName, id, callback) => {
        callback({ sha: latestCommitSha });
      });
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: latestCommitSha,
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .sha .latest-commit').exists({ count: 1 });
    assert.dom('.event-card-title .sha .latest-commit').hasText('#abc123d');
  });

  test('it does not render counts for collapsed event', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'COLLAPSED' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-footer .counts .count').doesNotExist();
  });

  test('it renders count values', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([
          { status: 'SUCCESS' },
          { status: 'UNSTABLE' },
          { status: 'SUCCESS' },
          { status: 'FAILURE' },
          { status: 'CREATED' }
        ]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-footer .counts .failures').exists({ count: 1 });
    assert.dom('.event-card-footer .counts .warnings').exists({ count: 1 });
    assert.dom('.event-card-footer .counts .successes').exists({ count: 1 });
  });

  test('it re-renders correctly when event changes', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .onCall(0)
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      })
      .onCall(1)
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'FAILURE' }]);
      });

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .event-status').hasClass('SUCCESS');
    assert.dom('.event-card-title .sha').hasText('#abc123d');

    this.setProperties({
      event: {
        id: 12,
        sha: 'deadbeef123',
        commit: { author: { name: 'robin' }, message: 'New change' },
        creator: { name: 'robin' },
        meta: {}
      }
    });

    await rerender();

    assert.dom('.event-card-title .event-status').hasClass('FAILURE');
    assert.dom('.event-card-title .sha').hasText('#deadbee');
  });

  test('it renders PR title', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/pulls/2');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        type: 'pr',
        prNum: 4
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .pr-title').exists({ count: 1 });
    assert.dom('.event-card-title .pr-title').containsText('PR-4');
    assert.dom('.event-card-title .start-event-button').doesNotExist();
  });

  test('it renders start event button for PR', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/pulls/2');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        type: 'pr',
        prNum: 4
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
        @allowEventAction={{true}}
      />`
    );

    assert.dom('.event-card-title .start-event-button').exists({ count: 1 });
  });

  test('it does not render highlight for PR', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );
    const selectedPrSha = this.owner.lookup('service:selected-pr-sha');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/pulls/2');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});
    sinon.stub(selectedPrSha, 'isEventSelected').returns(false);

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        type: 'pr',
        prNum: 4
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.highlighted').doesNotExist();
  });

  test('it renders PR highlight', async function (assert) {
    const router = this.owner.lookup('service:router');
    const workflowDataReload = this.owner.lookup(
      'service:workflow-data-reload'
    );
    const selectedPrSha = this.owner.lookup('service:selected-pr-sha');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/pulls/4');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});
    sinon.stub(selectedPrSha, 'isEventSelected').returns(true);

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        type: 'pr',
        prNum: 4
      },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.highlighted').exists({ count: 1 });
  });
});
