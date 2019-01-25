import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-events-list', 'Integration | Component | pipeline events list', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const events = [
    EmberObject.create({
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
    }),
    EmberObject.create({
      id: 3,
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
    })
  ];

  this.set('eventsMock', events);
  this.set('updateEventsMock', (page) => {
    assert.equal(page, 2);
  });
  this.render(hbs`{{pipeline-events-list
                    events=eventsMock
                    eventsPage=1
                    updateEvents=updateEventsMock}}`);

  assert.equal(this.$('.view').length, 2);
});
