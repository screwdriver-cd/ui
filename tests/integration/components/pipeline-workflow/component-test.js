import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import rsvp from 'rsvp';

const GRAPH = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { id: 1, name: 'main' },
    { id: 2, name: 'batman' },
    { id: 3, name: 'robin' }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'batman' },
    { src: 'batman', dest: 'robin' }
  ]
};

const BUILDS = [
  { jobId: 1, id: 4, status: 'SUCCESS' },
  { jobId: 2, id: 5, status: 'SUCCESS' },
  { jobId: 3, id: 6, status: 'FAILURE' }
];

module('Integration | Component | pipeline workflow', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders an event', async function(assert) {
    this.set('selected', 1);
    this.set(
      'obj',
      EmberObject.create({
        builds: rsvp.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test'
      })
    );

    await render(hbs`{{pipeline-workflow selectedEventObj=obj selected=selected}}`);

    assert.dom('.graph-node').exists({ count: 5 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
  });
});
