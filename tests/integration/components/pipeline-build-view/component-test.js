import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('pipeline-build-view', 'Integration | Component | pipeline build view', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const now = 1472244582531;

  const workflowMock = [
    {
      id: 'abcd',
      name: 'main',
      build: Ember.Object.create({
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
      })
    },
    {
      id: 'abcde',
      name: 'publish',
      build: Ember.Object.create({
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
    }
  ];

  this.set('workflowMock', workflowMock);

  this.render(hbs`{{pipeline-build-view workflow=workflowMock}}`);

  assert.equal(this.$('h6 a').text().trim(), '#123456');
  assert.equal(this.$('.cause').text().trim(), 'bananas');
  assert.equal(this.$('.job').length, 2, 'not enough work being done');
  assert.equal(this.$('.SUCCESS').length, 2, 'not successful enough');
});
