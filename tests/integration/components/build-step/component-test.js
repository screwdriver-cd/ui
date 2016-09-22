import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import Pretender from 'pretender';
let server;

moduleForComponent('build-step', 'Integration | Component | build step', {
  integration: true,

  beforeEach() {
    server = new Pretender(function () {
      // Verifies passthrough of correct build id to log component
      this.get('http://localhost:8080/v4/builds/1/steps/banana/logs', () => [
        200,
        { 'Content-Type': 'application/json', 'x-more-data': 'false' },
        JSON.stringify([{
          t: Date.now(),
          n: 1,
          m: 'hello, world'
        }])
      ]);
    });
  },

  afterEach() {
    server.shutdown();
  }
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = { id: 1 };
  const stepMock = { name: 'banana' };

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{build-step build=buildMock step=stepMock}}`);

  // step-view
  assert.equal(this.$('div.ember-view.queued').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('div.logs').length, 1, 'has log view');
});

test('it starts open when step failed', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = Ember.Object.extend({
    reload() {}
  }).create({
    id: '1',
    status: 'RUNNING'
  });
  const stepMock = {
    name: 'banana',
    code: 127,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  };

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{build-step build=buildMock step=stepMock}}`);

  // step-view
  assert.equal(this.$('div.ember-view.failure').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('.logs').length, 1, 'has log view');
  assert.equal(this.$('.is-open').length, 1);

  return wait().then(() => {
    assert.equal(this.$('.logs').text().trim(), 'hello, world');

    this.$('.name').click();

    return wait().then(() => {
      assert.equal(this.$('.is-open').length, 0);
    });
  });
});

test('it starts open when step is running', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = Ember.Object.extend({
    reload() {}
  }).create({
    id: '1',
    status: 'RUNNING'
  });
  const stepMock = {
    name: 'banana',
    code: null,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: null
  };

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{build-step build=buildMock step=stepMock}}`);

  // step-view
  assert.equal(this.$('div.ember-view.failure').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('.logs').length, 1, 'has log view');
  assert.equal(this.$('.is-open').length, 1);

  return wait().then(() => {
    assert.equal(this.$('.logs').text().trim(), 'hello, world');
  });
});

test('it can be opened', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = Ember.Object.extend({
    reload() {}
  }).create({
    id: '1',
    status: 'SUCCESS'
  });
  const stepMock = {
    name: 'banana',
    code: 0,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  };

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{build-step build=buildMock step=stepMock}}`);

  // step-view
  assert.equal(this.$('div.ember-view.success').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('.logs').length, 1, 'has log view');
  assert.equal(this.$('.is-open').length, 0);

  this.$('.name').click();

  return wait().then(() => {
    assert.ok(this.$('.is-open').length, 1);

    return wait().then(() => {
      assert.equal(this.$('.logs').text().trim(), 'hello, world');
    });
  });
});
