import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, rerender } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/event/card', function (hooks) {
  setupRenderingTest(hooks);

  let router;

  let workflowDataReload;

  let event;

  hooks.beforeEach(function () {
    router = this.owner.lookup('service:router');
    workflowDataReload = this.owner.lookup('service:workflow-data-reload');

    event = {
      id: 11,
      groupEventId: 11,
      sha: 'abc123def456',
      commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
      creator: { name: 'batman' },
      meta: {}
    };
  });

  test('it renders title when event is first in group', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    this.setProperties({
      event,
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
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    event.groupEventId = 3;

    this.setProperties({
      event,
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
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.highlighted').exists();
    assert.dom('.outlined').doesNotExist();
    assert.dom('.filtered').doesNotExist();
    assert.dom('.event-card-title .event-status').exists();
    assert.dom('.event-card-title .event-status').hasClass('SUCCESS');
    assert.dom('.event-card-title .event-status svg').exists();
    assert.dom('.event-card-title pr-title').doesNotExist();
    assert.dom('.event-card-title .sha').exists();
    assert.dom('.event-card-title .start-event-button').doesNotExist();

    assert.dom('.event-card-body').exists();
    assert.dom('.event-card-body .message').exists();
    assert.dom('.event-card-body .label').doesNotExist();
    assert.dom('.event-card-body .by').exists();
    assert.dom('.event-card-body .time').exists();

    assert.dom('.event-card-footer .counts').exists();
    assert.dom('.event-card-footer .event-buttons').exists();
    assert
      .dom('.event-card-footer .event-buttons .parameters-button')
      .doesNotExist();
    assert
      .dom('.event-card-footer .event-buttons .event-group-button')
      .doesNotExist();
  });

  test('it does not render highlight', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/99');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event,
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
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    event.meta = { label: 'Testing 123' };
    this.setProperties({
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-body .label').exists();
  });

  test('it renders button for parameters', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    event.meta = {
      parameters: {
        foo: { value: 'bar' }
      }
    };

    this.setProperties({
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
        @showParameters={{true}}
      />`
    );

    assert.dom('.event-card-footer .event-buttons .parameters-button').exists();
  });

  test('it renders button for event group', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    event.meta = {
      parameters: {
        foo: { value: 'bar' }
      }
    };

    this.setProperties({
      event,
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
      .exists();
  });

  test('it renders abort button for running event', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'RUNNING' }]);
      });

    this.setProperties({
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
        @allowEventAction={{true}}
      />`
    );

    assert.dom('.event-card-title .abort-event-button').exists();
  });

  test('it renders latest commit badge', async function (assert) {
    const latestCommitSha = 'abc123def456';

    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
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
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .sha .latest-commit').exists();
    assert.dom('.event-card-title .sha .latest-commit').hasText('#abc123d');
  });

  test('it does not render counts for collapsed event', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'COLLAPSED' }]);
      });

    this.setProperties({
      event,
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
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
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
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-footer .counts .failures').exists();
    assert.dom('.event-card-footer .counts .warnings').exists();
    assert.dom('.event-card-footer .counts .successes').exists();
  });

  test('it re-renders correctly when event changes', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
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
      event,
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
    sinon.stub(router, 'currentURL').value('/pipelines/1/pulls/2');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    event.type = 'pr';
    event.prNum = 4;

    this.setProperties({
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .pr-title').exists();
    assert.dom('.event-card-title .pr-title').containsText('PR-4');
    assert.dom('.event-card-title .start-event-button').doesNotExist();
  });

  test('it renders start event button for PR', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/pulls/2');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake(() => {});

    event.type = 'pr';
    event.prNum = 4;
    this.setProperties({
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @userSettings={{this.userSettings}}
        @allowEventAction={{true}}
      />`
    );

    assert.dom('.event-card-title .start-event-button').exists();
  });

  test('it renders card outline', async function (assert) {
    sinon.stub(router, 'currentURL').value('/pipelines/1/events/11');
    sinon
      .stub(workflowDataReload, 'registerLatestCommitEventCallback')
      .callsFake(() => {});
    sinon
      .stub(workflowDataReload, 'registerBuildsCallback')
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      });

    this.setProperties({
      event,
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @baseEvent={{this.event}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.outlined').exists();
  });
});
