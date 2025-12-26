import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, rerender } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/event/card', function (hooks) {
  setupRenderingTest(hooks);

  let router;

  let routerStub;

  let workflowDataReload;

  let registerLatestCommitEventCallbackStub;

  let registerBuildsCallbackStub;

  let event;

  hooks.beforeEach(function () {
    const settings = this.owner.lookup('service:settings');

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

    sinon.stub(settings, 'getSettings').returns({});

    registerLatestCommitEventCallbackStub = sinon.stub(
      workflowDataReload,
      'registerLatestCommitEventCallback'
    );
    registerLatestCommitEventCallbackStub.callsFake(() => {});

    registerBuildsCallbackStub = sinon.stub(
      workflowDataReload,
      'registerBuildsCallback'
    );
    registerBuildsCallbackStub.callsFake(() => {});

    routerStub = sinon.stub(router, 'currentURL');
    routerStub.value(`/pipelines/1/events/${event.id}`);
  });

  test('it renders title when event is first in group', async function (assert) {
    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card').hasAttribute('title', 'Event: 11');
  });

  test('it renders title when event is in group', async function (assert) {
    event.groupEventId = 3;

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card').hasAttribute('title', `Event: 11\nGroup: 3`);
  });

  test('it renders core elements', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
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
    routerStub.reset();
    routerStub.value('/pipelines/1/events/99');
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @builds={{this.builds}}
        @latestCommitEvent={{this.latestCommitEvent}}
      />`
    );

    assert.dom('.highlighted').doesNotExist();
  });

  test('it renders event label', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    event.meta = { label: 'Testing 123' };
    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-body .label').exists();
  });

  test('it renders button for parameters', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    event.meta = {
      parameters: {
        foo: { value: 'bar' }
      }
    };

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @showParameters={{true}}
      />`
    );

    assert.dom('.event-card-footer .event-buttons .parameters-button').exists();
  });

  test('it renders button for event group', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    event.meta = {
      parameters: {
        foo: { value: 'bar' }
      }
    };

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @showEventGroup={{true}}
      />`
    );

    assert
      .dom('.event-card-footer .event-buttons .event-group-button')
      .exists();
  });

  test('it renders abort button for running event', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'RUNNING' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @allowEventAction={{true}}
      />`
    );

    assert.dom('.event-card-title .abort-event-button').exists();
  });

  test('it renders latest commit badge', async function (assert) {
    const latestCommitSha = 'abc123def456';

    registerLatestCommitEventCallbackStub.reset();
    registerLatestCommitEventCallbackStub.callsFake(
      (queueName, id, callback) => {
        callback({ sha: latestCommitSha });
      }
    );
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-title .sha .latest-commit').exists();
    assert.dom('.event-card-title .sha .latest-commit').hasText('#abc123d');
  });

  test('it does not throw when latestCommitEvent is null', async function (assert) {
    registerLatestCommitEventCallbackStub.reset();
    registerLatestCommitEventCallbackStub.callsFake(
      (queueName, id, callback) => {
        callback(null);
      }
    );
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-title .sha .latest-commit').doesNotExist();
  });

  test('it does not render counts for collapsed event', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'COLLAPSED' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-footer .counts .count').doesNotExist();
  });

  test('it renders count values', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([
        { status: 'SUCCESS' },
        { status: 'UNSTABLE' },
        { status: 'SUCCESS' },
        { status: 'FAILURE' },
        { status: 'CREATED' }
      ]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-footer .counts .failures').exists();
    assert.dom('.event-card-footer .counts .warnings').exists();
    assert.dom('.event-card-footer .counts .successes').exists();
  });

  test('it re-renders correctly when event changes', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub
      .onCall(0)
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'SUCCESS' }]);
      })
      .onCall(1)
      .callsFake((queueName, id, callback) => {
        callback([{ status: 'FAILURE' }]);
      });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
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
    routerStub.reset();
    routerStub.value('/pipelines/1/pulls/2');

    event.type = 'pr';
    event.prNum = 4;

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-title .pr-title').exists();
    assert.dom('.event-card-title .pr-title').containsText('PR-4');
    assert.dom('.event-card-title .start-event-button').doesNotExist();
  });

  test('it renders start event button for PR', async function (assert) {
    routerStub.reset();
    routerStub.value('/pipelines/1/pulls/2');

    event.type = 'pr';
    event.prNum = 4;
    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @allowEventAction={{true}}
      />`
    );

    assert.dom('.event-card-title .start-event-button').exists();
  });

  test('it renders card outline', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @baseEvent={{this.event}}
      />`
    );

    assert.dom('.outlined').exists();
  });

  test('it renders event status correctly for warning status', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([{ status: 'SUCCESS' }, { status: 'WARNING' }]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-title .event-status.WARNING').exists();
  });

  test('it renders event status correctly for failure status', async function (assert) {
    registerBuildsCallbackStub.reset();
    registerBuildsCallbackStub.callsFake((queueName, id, callback) => {
      callback([
        { status: 'SUCCESS' },
        { status: 'WARNING' },
        { status: 'FAILURE' }
      ]);
    });

    this.setProperties({
      event
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
      />`
    );

    assert.dom('.event-card-title .event-status.FAILURE').exists();
  });
});
