import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

const logService = Ember.Service.extend({
  fetchLogs() {
    return Ember.RSVP.resolve({
      lines: [{ m: 'hello, world', n: 1, t: 1478912844724 }],
      done: true
    });
  }
});

moduleForComponent('build-step', 'Integration | Component | build step', {
  integration: true,
  beforeEach() {
    this.register('service:build-logs', logService);
  }
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.render(hbs`{{build-step
    stepName="banana"
    startTime=undefined
    endTime=undefined
    code=undefined
    buildId=1
    autoscroll=true
  }}`);

  // step-view
  assert.equal(this.$('.step-view').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('.build-log').length, 1, 'has log view');
  assert.notOk(this.$('.build-step').hasClass('is-open'), 'rendered closed');
});

test('it starts open when step failed', function (assert) {
  const $ = this.$;

  this.render(hbs`{{build-step
    stepName="banana"
    startTime='2016-08-26T20:49:42.531Z'
    endTime='2016-08-26T20:50:52.531Z'
    code=127
    buildId=1
    autoscroll=true
  }}`);

  assert.equal($('.step-view.failure').length, 1, 'has step view');
  assert.equal($('.build-log').length, 1, 'has log view');
  assert.ok($('.build-step').hasClass('is-open'), 'rendered open');
  assert.equal($('.build-log').text().trim(), 'hello, world');

  $('.name').click();

  return wait().then(() => {
    assert.notOk($('.build-step').hasClass('is-open'), 'user closed');
  });
});

test('it starts open when step is running', function (assert) {
  this.render(hbs`{{build-step
    stepName="banana"
    startTime='2016-08-26T20:49:42.531Z'
    endTime=undefined
    code=undefined
    buildId=1
    autoscroll=true
  }}`);

  // step-view
  assert.equal(this.$('.step-view.running').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('.build-log').length, 1, 'has log view');
  assert.ok(this.$('.build-step').hasClass('is-open'));

  return wait().then(() => {
    assert.equal(this.$('.build-log').text().trim(), 'hello, world');
  });
});

test('it can toggle open and closed', function (assert) {
  this.render(hbs`{{build-step
    stepName="banana"
    startTime='2016-08-26T20:49:42.531Z'
    endTime='2016-08-26T20:50:52.531Z'
    code=0
    buildId=1
    autoscroll=true
  }}`);

  // step-view
  assert.equal(this.$('.step-view.success').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('.build-log').length, 1, 'has log view');
  assert.notOk(this.$('.build-step').hasClass('.is-open'), 'is closed');

  this.$('.name').click();

  return wait().then(() => {
    assert.ok(this.$('.build-step').hasClass('is-open'), 'is open');
    assert.equal(this.$('.build-log').text().trim(), 'hello, world');

    this.$('.name').click();

    return wait().then(() => {
      assert.notOk(this.$('.build-step').hasClass('is-open'), 'is open');
    });
  });
});

test('it can not toggle open', function (assert) {
  this.render(hbs`{{build-step
    stepName="banana"
    startTime=undefined
    endTime=undefined
    code=undefined
    buildId=1
    autoscroll=true
  }}`);

  // step-view
  assert.equal(this.$('.step-view.queued').length, 1, 'has step view');
  // step-logs
  assert.equal(this.$('.build-log').length, 1, 'has log view');
  assert.notOk(this.$('.build-step').hasClass('.is-open'), 'is closed');

  this.$('.name').click();

  return wait().then(() => {
    assert.notOk(this.$('.build-step').hasClass('is-open'), 'is open');
  });
});
