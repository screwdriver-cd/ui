import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-pr-view', 'Integration | Component | pipeline pr view', {
  integration: true
});

test('it renders a successful PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234:main',
    createTimeWords: 'now',
    title: 'update readme',
    username: 'anonymous',
    builds: [{
      id: '1234',
      status: 'SUCCESS',
      startTimeWords: 'now'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$('.SUCCESS').length, 1);
  assert.equal(this.$('.detail').text().trim().replace(/\s{2,}/g, ' '), 'main Started now');
  assert.equal(this.$('.date').text().trim(), 'Started now');
  assert.equal(this.$('.status .fa-check-circle-o').length, 1);
});

// When a user sets a job to unstable, it should show unstable icon
test('it renders an unstable PR', function (assert) {
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234:main',
    createTimeWords: 'now',
    title: 'update readme',
    username: 'anonymous',
    builds: [{
      id: '1234',
      status: 'UNSTABLE',
      startTimeWords: 'now'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$('.UNSTABLE').length, 1);
  assert.equal(this.$('.fa-exclamation-circle').length, 1);
});

test('it renders a failed PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234:main',
    createTimeWords: 'now',
    title: 'update readme',
    username: 'anonymous',
    builds: [{
      id: '1234',
      status: 'FAILURE',
      startTimeWords: 'now'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$('.FAILURE').length, 1);
  assert.equal(this.$('.fa-times-circle-o').length, 1);
});

test('it renders a queued PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234:main',
    createTimeWords: 'now',
    title: 'update readme',
    username: 'anonymous',
    builds: [{
      id: '1234',
      status: 'QUEUED',
      startTimeWords: 'now'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$('.QUEUED').length, 1);
  assert.equal(this.$('.fa-spinner').length, 1);
});

test('it renders a running PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234:main',
    createTimeWords: 'now',
    title: 'update readme',
    username: 'anonymous',
    builds: [{
      id: '1234',
      status: 'RUNNING',
      startTimeWords: 'now'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$('.RUNNING').length, 1);
  assert.equal(this.$('.fa-spinner').length, 1);
});
