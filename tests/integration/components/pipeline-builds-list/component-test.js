import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';
const now = 1472244582531;

moduleForComponent('pipeline-builds-list', 'Integration | Component | pipeline builds list', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const builds = [
    Ember.Object.create({
      jobId: 'abcd',
      sha: '12345678901234567890',
      cause: 'bananas',
      buildContainer: 'node:6',
      createTime: now - 180000,
      startTime: now - 175000,
      endTime: now - 165000,
      buildDuration: 5,
      queuedDuration: 5,
      status: 'SUCCESS'
    }),
    Ember.Object.create({
      jobId: 'abcde',
      sha: '12345678901234567890',
      cause: 'bananas',
      buildContainer: 'node:6',
      createTime: now - 165000,
      startTime: now - 155000,
      endTime: now,
      buildDuration: 155,
      queuedDuration: 5,
      status: 'SUCCESS'
    })
  ];
  const jobs = [
    Ember.Object.create({
      id: 'abcd',
      name: 'main'
    }),
    Ember.Object.create({
      id: 'abcde',
      name: 'publish'
    })
  ];

  this.set('buildsMock', builds);
  this.set('jobsMock', jobs);

  this.render(hbs`{{pipeline-builds-list buildList=buildsMock jobs=jobsMock}}`);

  assert.equal(this.$('h2').text().trim(), 'Builds');
  assert.equal(this.$('> div').length, 1);
});
