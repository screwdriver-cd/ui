import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/event/card', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders title when event is first in group', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      pipeline: {},
      userSettings: {},
      builds: [],
      latestCommitEvent: { sha: 'abc123def456' }
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @userSettings={{this.userSettings}}
        @builds={{this.builds}}
        @latestCommitEvent={{this.latestCommitEvent}}
      />`
    );

    assert.dom('.event-card').hasAttribute('title', 'Event: 11');
  });

  test('it renders title when event is first in group', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');

    this.setProperties({
      event: {
        id: 11,
        groupEventId: 3,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      pipeline: {},
      userSettings: {},
      builds: [],
      latestCommitEvent: { sha: 'abc123def456' }
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @userSettings={{this.userSettings}}
        @builds={{this.builds}}
        @latestCommitEvent={{this.latestCommitEvent}}
      />`
    );

    assert.dom('.event-card').hasAttribute('title', `Event: 11\nGroup: 3`);
  });

  test('it renders core elements', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      builds: [{ status: 'SUCCESS' }],
      pipeline: {},
      latestCommitEvent: { sha: 'abc123def456' },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @builds={{this.builds}}
        @pipeline={{this.pipeline}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.highlighted').exists({ count: 1 });
    assert.dom('.event-card-title .event-status').exists({ count: 1 });
    assert.dom('.event-card-title .event-status').hasClass('SUCCESS');
    assert.dom('.event-card-title .event-status svg').exists({ count: 1 });
    assert.dom('.event-card-title .sha').exists({ count: 1 });

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
  });

  test('it does not render highlight', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/99');

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      builds: [{ status: 'SUCCESS' }],
      pipeline: {},
      latestCommitEvent: { sha: 'abc123def456' },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @builds={{this.builds}}
        @pipeline={{this.pipeline}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.highlighted').doesNotExist();
  });

  test('it renders event label', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: { label: 'Testing 123' }
      },
      builds: [{ status: 'SUCCESS' }],
      pipeline: {},
      latestCommitEvent: { sha: 'abc123def456' },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @builds={{this.builds}}
        @pipeline={{this.pipeline}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-body .label').exists({ count: 1 });
  });

  test('it renders button for parameters', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');

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
      builds: [{ status: 'SUCCESS' }],
      pipeline: {},
      latestCommitEvent: { sha: 'abc123def456' },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @builds={{this.builds}}
        @pipeline={{this.pipeline}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @userSettings={{this.userSettings}}
        @showParameters={{true}}
      />`
    );

    assert
      .dom('.event-card-footer .event-buttons .parameters-button')
      .exists({ count: 1 });
  });

  test('it renders abort button for running event', async function (assert) {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('/v2/pipelines/1/events/11');

    this.setProperties({
      event: {
        id: 11,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      },
      builds: [{ status: 'RUNNING' }],
      pipeline: {},
      latestCommitEvent: { sha: 'abc123def456' },
      userSettings: {}
    });

    await render(
      hbs`<Pipeline::Event::Card
        @event={{this.event}}
        @builds={{this.builds}}
        @pipeline={{this.pipeline}}
        @latestCommitEvent={{this.latestCommitEvent}}
        @userSettings={{this.userSettings}}
      />`
    );

    assert.dom('.event-card-title .abort-event-button').exists({ count: 1 });
  });
});
