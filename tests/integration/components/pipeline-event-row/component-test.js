import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
import { merge } from '@ember/polyfills';
import { copy } from '@ember/object/internals';

const event = {
  id: 3,
  startFrom: '~commit',
  status: 'SUCCESS',
  type: 'pipeline',
  causeMessage: 'test',
  commit: {
    url: '#',
    message: 'this was a test'
  },
  creator: {
    url: '#',
    name: 'batman'
  },
  createTimeWords: 'now',
  durationText: '1 sec',
  truncatedMessage: 'this was a test',
  truncatedSha: 'abc123',
  workflowGraph: {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      { id: 1, name: 'main' },
      { id: 2, name: 'A' },
      { id: 3, name: 'B' }
    ],
    edges: [
      { src: '~pr', dest: 'main' },
      { src: '~commit', dest: 'main' },
      { src: 'main', dest: 'A' },
      { src: 'A', dest: 'B' }
    ]
  },
  builds: [
    { jobId: 1, id: 4, status: 'SUCCESS' },
    { jobId: 2, id: 5, status: 'SUCCESS' },
    { jobId: 3, id: 6, status: 'FAILURE' }
  ]
};

module('Integration | Component | pipeline event row', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('it renders with pipeline event', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    const eventMock = EmberObject.create(copy(event, true));

    this.set('event', eventMock);

    await render(hbs`{{pipeline-event-row event=event selectedEvent=3 lastSuccessful=3}}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit').hasText('#abc123');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('batman');
    assert.dom('.date').hasText('Started now');
  });

  test('it renders with pr event', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.actions.eventClick = () => {
      assert.ok(true);
    };

    const eventMock = EmberObject.create(merge(copy(event, true), {
      startFrom: '~pr',
      type: 'pr',
      pr: {
        url: 'https://foo/bar/baz/pull/2'
      },
      prNum: 2
    }));

    this.set('event', eventMock);

    await render(hbs`{{pipeline-event-row event=event selectedEvent=3 lastSuccessful=3}}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
    assert.dom('.commit').hasText('PR-2');
    assert.dom('.message').hasText('this was a test');
    assert.dom('svg').exists({ count: 1 });
    assert.dom('.graph-node').exists({ count: 4 });
    assert.dom('.graph-edge').exists({ count: 3 });
    assert.dom('.by').hasText('batman');
    assert.dom('.date').hasText('Started now');
  });
});
