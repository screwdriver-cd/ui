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
  const buildMock = {
    jobId: 'abcd',
    sha: '12345678901234567890',
    cause: 'bananas',
    buildContainer: 'node:6',
    createTime: now - 180000,
    startTime: now - 175000,
    endTime: now,
    buildDuration: 175,
    queuedDuration: 5
  };
  const jobs = [
    Ember.Object.create({ id: 'abcd', name: 'hello' }),
    Ember.Object.create({ id: 'efgh', name: 'world' })
  ];

  this.set('buildMock', buildMock);
  this.set('jobsMock', jobs);

  this.render(hbs`{{pipeline-build-view build=buildMock jobs=jobsMock}}`);

  assert.equal(this.$('h6 a').text().trim(), '123456');
  assert.equal(this.$('.job').text().trim(), 'hello');
  assert.equal(this.$('.cause').text().trim(), 'bananas');
});
