import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import moment from 'moment';
const time1 = 1478912844724;
const time2 = 1478912845725;
const timeFormat1 = moment(time1).format('HH:mm:ss');
const timeFormat2 = moment(time2).format('HH:mm:ss');

const logService = Ember.Service.extend({
  fetchLogs() {
    return Ember.RSVP.resolve({
      lines: [
        { m: 'hello', n: 1, t: time1 },
        { m: 'world', n: 2, t: time2 }
      ],
      done: true
    });
  }
});

moduleForComponent('build-log', 'Integration | Component | build log', {
  integration: true,

  beforeEach() {
    this.register('service:build-logs', logService);
  }
});

test('it renders closed', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.render(hbs`{{build-log
    stepName="banana"
    buildId=1
    isOpen=false
    autoscroll=true
  }}`);

  assert.equal(this.$().text().trim(), '');
  assert.notOk(this.$('.build-log').hasClass('is-open'));

  // Template block usage:
  this.render(hbs`{{#build-log
    stepName="banana"
    buildId=1
    isOpen=false
    autoscroll=true
  }}
  template block text
  {{/build-log}}`);

  assert.equal(this.$().text().trim(), 'template block text');
});

test('it renders open when told to', function (assert) {
  assert.expect(2);

  this.render(hbs`{{build-log
    stepName="banana"
    buildId=1
    isOpen=true
    autoscroll=true
  }}`);

  assert.ok(this.$('.build-log').hasClass('is-open'));

  return wait().then(() => {
    assert.ok(this.$().text().trim().match(`${timeFormat1}\\s+hello\\s+${timeFormat2}\\s+world`));
  });
});

test('it starts loading when open changes', function (assert) {
  this.set('open', false);
  this.render(hbs`{{build-log
    stepName="banana"
    buildId=1
    isOpen=open
    autoscroll=true
  }}`);

  assert.notOk(this.$('.build-log').hasClass('is-open'), 'is closed');
  assert.equal(this.$().text().trim(), '');
  this.set('open', true);

  return wait().then(() => {
    assert.ok(this.$('.build-log').hasClass('is-open'), 'is open');
    assert.ok(this.$().text().trim().match(`${timeFormat1}\\s+hello\\s+${timeFormat2}\\s+world`));
  });
});

test('it handles clicks', function (assert) {
  assert.expect(1);

  this.set('clickHandler', () => {
    assert.ok(true);
  });

  this.render(hbs`{{build-log
    stepName="banana"
    buildId=1
    isOpen=false
    autoscroll=true
    onClick=(action clickHandler)
  }}`);

  this.$('.build-log').click();
});
