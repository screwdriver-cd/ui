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
    name: 'PR-1234',
    builds: [{
      id: '1234',
      status: 'SUCCESS'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$().text().trim(), 'PR-1234');
  assert.equal(this.$('.fa-check').length, 1);
});

// When a user changes files in the PR that do not match sourcePaths, the
// PR will be created but not started
test('it renders a created (but not running) PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234',
    builds: [{
      id: '1234',
      status: 'CREATED'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$().text().trim(), 'PR-1234');
  assert.equal(this.$('.fa-ban').length, 1);
});

test('it renders a failed PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234',
    builds: [{
      id: '1234',
      status: 'FAILURE'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$().text().trim(), 'PR-1234');
  assert.equal(this.$('.fa-times').length, 1);
});

test('it renders a queued PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234',
    builds: [{
      id: '1234',
      status: 'QUEUED'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$().text().trim(), 'PR-1234');
  assert.equal(this.$('.fa-spinner').length, 1);
});

test('it renders a running PR', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const job = EmberObject.create({
    id: 'abcd',
    name: 'PR-1234',
    builds: [{
      id: '1234',
      status: 'RUNNING'
    }]
  });

  this.set('jobMock', job);

  this.render(hbs`{{pipeline-pr-view job=jobMock}}`);

  assert.equal(this.$().text().trim(), 'PR-1234');
  assert.equal(this.$('.fa-spinner').length, 1);
});
