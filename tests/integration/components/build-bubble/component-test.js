import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-bubble', 'Integration | Component | build bubble', {
  integration: true
});

test('it renders a success bubble', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = Ember.Object.create({
    status: 'SUCCESS',
    sha: 'abcdef12345'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock jobName="batman" jobIsDisabled=false}}`);

  assert.equal(this.$('p').text().trim(), 'batman');
  assert.equal(this.$('a').prop('title').trim(), 'abcdef12345');
  assert.ok(this.$('a i').hasClass('fa-check'));
  assert.ok(this.$('.dir-arrow i').hasClass('fa-long-arrow-right'));
});

test('it renders a failure bubble', function (assert) {
  const buildMock = Ember.Object.create({
    status: 'FAILURE',
    sha: 'abcdef12345'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock jobName="batman" jobIsDisabled=false}}`);

  assert.equal(this.$('p').text().trim(), 'batman');
  assert.equal(this.$('a').prop('title').trim(), 'abcdef12345');
  assert.ok(this.$('a i').hasClass('fa-times'));
  assert.ok(this.$('.dir-arrow i').hasClass('fa-long-arrow-right'));
});

test('it renders a running bubble', function (assert) {
  const buildMock = Ember.Object.create({
    status: 'RUNNING',
    sha: 'abcdef12345'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock jobName="batman" jobIsDisabled=false}}`);

  assert.equal(this.$('p').text().trim(), 'batman');
  assert.equal(this.$('a').prop('title').trim(), 'abcdef12345');
  assert.ok(this.$('a i').hasClass('fa-spinner'));
  assert.ok(this.$('a i').hasClass('fa-spin'));
  assert.ok(this.$('.dir-arrow i').hasClass('fa-long-arrow-right'));
});

test('it renders a queued bubble', function (assert) {
  const buildMock = Ember.Object.create({
    status: 'QUEUED',
    sha: 'abcdef12345'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock jobName="batman" jobIsDisabled=false}}`);

  assert.equal(this.$('p').text().trim(), 'batman');
  assert.equal(this.$('a').prop('title').trim(), 'abcdef12345');
  assert.ok(this.$('a i').hasClass('fa-clock-o'));
  assert.ok(this.$('.dir-arrow i').hasClass('fa-long-arrow-right'));
});

test('it renders an aborted bubble', function (assert) {
  const buildMock = Ember.Object.create({
    status: 'ABORTED',
    sha: 'abcdef12345'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock jobName="batman" jobIsDisabled=false}}`);

  assert.ok(this.$('a i').hasClass('fa-stop'));
});

test('it renders a unknown bubble', function (assert) {
  const buildMock = Ember.Object.create({
    status: 'banana',
    sha: 'abcdef12345'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock jobName="batman" jobIsDisabled=false}}`);

  assert.equal(this.$('p').text().trim(), 'batman');
  assert.equal(this.$('a').prop('title').trim(), 'abcdef12345');
  assert.ok(this.$('a i').hasClass('fa-question'));
  assert.ok(this.$('.dir-arrow i').hasClass('fa-long-arrow-right'));
});

test('it renders an empty bubble', function (assert) {
  this.render(hbs`{{build-bubble jobName="batman" jobIsDisabled=false}}`);

  assert.equal(this.$('p').text().trim(), 'batman');
  assert.equal(this.$('a').prop('title').trim(), '');
});

test('it renders a disabled bubble', function (assert) {
  const buildMock = Ember.Object.create({
    status: 'banana',
    sha: 'abcdef12345'
  });

  this.set('buildMock', buildMock);

  this.render(hbs`{{build-bubble build=buildMock jobName="batman" jobIsDisabled=true}}`);

  assert.equal(this.$('p').text().trim(), 'batman');
  assert.equal(this.$('a').prop('title').trim(), 'abcdef12345');
  assert.ok(this.$('a i').hasClass('fa-pause'));
  assert.ok(this.$('.dir-arrow i').hasClass('fa-long-arrow-right'));
});
