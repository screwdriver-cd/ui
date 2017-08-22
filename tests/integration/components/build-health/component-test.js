import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-health', 'Integration | Component | build health', {
  integration: true
});

test('it renders a success bubble', function (assert) {
  const buildMock = Ember.Object.create({
    id: 1,
    status: 'SUCCESS'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock pipelineId=1}}`);

  assert.ok(this.$('a i').hasClass('fa-check'));
});

test('it renders a failure bubble', function (assert) {
  const buildMock = Ember.Object.create({
    id: 1,
    status: 'FAILURE'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock pipelineId=1}}`);

  assert.ok(this.$('a i').hasClass('fa-times'));
});

test('it renders a running bubble', function (assert) {
  const buildMock = Ember.Object.create({
    id: 1,
    status: 'RUNNING'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock piplineId=1}}`);

  assert.ok(this.$('a i').hasClass('fa-spinner'));
  assert.ok(this.$('a i').hasClass('fa-spin'));
});

test('it renders a queued bubble', function (assert) {
  const buildMock = Ember.Object.create({
    id: 1,
    status: 'QUEUED'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock pipelineId=1}}`);

  assert.ok(this.$('a i').hasClass('fa-clock-o'));
});

test('it renders an aborted bubble', function (assert) {
  const buildMock = Ember.Object.create({
    id: 1,
    status: 'ABORTED'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock pipelineId=1}}`);

  assert.ok(this.$('a i').hasClass('fa-stop'));
});

test('it renders an unknown bubble', function (assert) {
  const buildMock = Ember.Object.create({
    id: 1,
    status: 'banana'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock pipelineId=1}}`);

  assert.ok(this.$('a i').hasClass('fa-question'));
});

test('it renders an empty bubble', function (assert) {
  this.render(hbs`{{build-bubble}}`);

  assert.ok(this.$('a i').length);
});
