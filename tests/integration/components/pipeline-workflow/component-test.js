import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll } from '@ember/test-helpers';
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

  test('it renders an aggregate', async function(assert) {
    const jobs = ['main', 'batman', 'robin'].map((name) => {
      const j = {
        name,
        isDisabled: false,
        lastBuild: EmberObject.create({
          id: 12345,
          status: 'SUCCESS',
          sha: 'abcd1234'
        })
      };

      return EmberObject.create(j);
    });

    this.set('jobsMock', jobs);
    this.set('graph', GRAPH);
    this.set('selected', 'aggregate');

    await render(hbs`{{pipeline-workflow workflowGraph=graph jobs=jobsMock selected=selected}}`);

    assert.equal(findAll('.graph-node').length, 5);
    assert.equal(findAll('.workflow-tooltip').length, 1);
  });

  test('it renders an event', async function(assert) {
    this.set('selected', 1);
    this.set('obj', EmberObject.create({
      builds: rsvp.resolve(BUILDS),
      workflowGraph: GRAPH,
      startFrom: '~commit',
      causeMessage: 'test'
    }));

    await render(hbs`{{pipeline-workflow selectedEventObj=obj selected=selected}}`);

    assert.equal(findAll('.graph-node').length, 5);
    assert.equal(findAll('.workflow-tooltip').length, 1);
  });
});
