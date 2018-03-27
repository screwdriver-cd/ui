import { resolve } from 'rsvp';
import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import moment from 'moment';
const time1 = 1478912844724;
const time2 = 1478912845725;
const timeFormat1 = moment(time1).format('HH:mm:ss');
const timeFormat2 = moment(time2).format('HH:mm:ss');

const logService = Service.extend({
  fetchLogs() {
    return resolve({
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

test('it displays some help when no step is selected', function (assert) {
  this.render(hbs`{{build-log
    stepName=null
    buildId=1
    stepStartTime=null
    buildStartTime="1478912844724"
  }}`);

  assert.equal(this.$().text().trim(), 'Click a step to see logs');

  // Template block usage:
  this.render(hbs`{{#build-log
    stepName=null
    buildId=1
    stepStartTime=null
    buildStartTime="1478912844724"
  }}
  template block text
  {{/build-log}}`);

  assert.ok(/^template block text/.test(this.$().text().trim()));
  assert.ok(/Click a step to see logs$/.test(this.$().text().trim()));
});

test('it starts loading when step chosen', function (assert) {
  this.set('step', null);
  this.render(hbs`{{build-log
    stepName=step
    buildId=1
    stepStartTime=null
    buildStartTime="1478912844724"
  }}`);

  assert.equal(this.$().text().trim(), 'Click a step to see logs');
  this.set('step', 'banana');

  return wait().then(() => {
    assert.ok(this.$().text().trim().match(`${timeFormat1}\\s+hello\\s+${timeFormat2}\\s+world`));
  });
});

// TODO: tests for scrolling behaviors?
