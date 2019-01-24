import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

moduleForComponent('pipeline-event-row', 'Integration | Component | pipeline event row', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.on('eventClick', () => {
    assert.ok(true);
  });

  const event = EmberObject.create({
    id: 3,
    startFrom: '~commit',
    status: 'SUCCESS',
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
  });

  this.set('event', event);

  this.render(hbs`{{pipeline-event-row event=event selectedEvent=3 lastSuccessful=3}}`);

  assert.equal(this.$('.SUCCESS').length, 1);
  assert.equal(this.$('.status .fa-check-circle-o').length, 1);
  assert.equal(this.$('.commit').text().trim(), '#abc123');
  assert.equal(this.$('.message').text().trim(), 'this was a test');
  assert.equal(this.$('svg').length, 1);
  assert.equal(this.$('.graph-node').length, 4);
  assert.equal(this.$('.graph-edge').length, 3);
  assert.equal(this.$('.by').text().trim(), 'batman');
  assert.equal(this.$('.date').text().trim(), 'Built now');
});
