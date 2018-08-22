import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('draggable-box', 'Integration | Component | draggable box', {
  integration: true
});

test('it renders', function (assert) {
  const event = EmberObject.create({
    id: 4,
    startFrom: '~commit',
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
    truncatedSha: 'abc124',
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
  });

  const build = EmberObject.create({
    jobId: 1,
    id: 4,
    status: 'SUCCESS'
  });

  this.set('builds', event.builds);
  this.set('workflowGraph', event.workflowGraph);
  this.set('startFrom', event.startFrom);
  this.set('causeMessage', event.causeMessage);
  this.set('event', event);
  this.set('build', build);

  this.render(hbs`{{draggable-box event=event build=build}}`);

  const svg = this.$('svg');

  assert.equal(svg.length, 1);
  assert.equal(svg.children('g.graph-node').length, 5);
  assert.equal(svg.children('g.graph-node.build-success').length, 2);
  assert.equal(svg.children('g.graph-node.build-failure').length, 1);
  assert.equal(svg.children('g.graph-node.build-started_from').length, 1);
  assert.equal(svg.children('path.graph-edge').length, 4);
  assert.equal(svg.children('path.graph-edge.build-started_from').length, 1);
  assert.equal(svg.children('path.graph-edge.build-success').length, 2);
});
