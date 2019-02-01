import { resolve } from 'rsvp';
import Service from '@ember/service';
import { run } from '@ember/runloop';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import moment from 'moment';
import sinon from 'sinon';
const startTime = 1478912844724;
const doneStub = sinon.stub();
const logsStub = sinon.stub();
const blobUrl = 'blob:https://localhost/34dba0dc-2706-4cae-a74f-99349a578e60';
const sampleLogs = Array(100).fill().map((_, i) => ({
  m: `${startTime + i}`,
  n: i + 1,
  t: startTime + i
}));
const logService = Service.extend({
  fetchLogs() {
    return resolve({
      lines: this.getCache('logs'),
      done: this.getCache('done')
    });
  },
  resetCache() {},
  getCache() {
    const lastArg = arguments[arguments.length - 1];

    if (lastArg === 'logs') {
      return logsStub();
    }

    if (lastArg === 'done') {
      return doneStub();
    }

    return 100;
  },
  buildLogBlobUrl() { return blobUrl; },
  revokeLogBlobUrls() {}
});

moduleForComponent('build-log', 'Integration | Component | build log', {
  integration: true,

  beforeEach() {
    this.register('service:build-logs', logService);
    doneStub.onCall(0).returns(true);
    doneStub.onCall(1).returns(false);
    logsStub.onCall(0).returns(sampleLogs);
    logsStub.onCall(1).returns(sampleLogs);
    logsStub.returns(sampleLogs.concat(sampleLogs));
  },

  afterEach() {
    doneStub.reset();
    logsStub.reset();
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
    assert.ok(
      this.$('.line:first').text().trim().match(
        `${moment(startTime).format('HH:mm:ss')}\\s+${startTime}`
      )
    );
    assert.ok(
      this.$('.line:last').text().trim().match(
        `${moment(startTime + 99).format('HH:mm:ss')}\\s+${startTime + 99}`
      )
    );
  });
});

test('it generate logs for init step', function (assert) {
  this.set('stats', {
    queueEnterTime: '2019-01-14T20:10:41.238Z',
    imagePullStartTime: '2019-01-14T20:11:41.238Z',
    hostname: 'node12.foo.bar.com'
  });
  this.set('step', 'sd-setup-init');
  this.render(hbs`{{build-log
    stepName=step
    buildId=1
    buildStartTime="2019-01-14T20:12:41.238Z"
    stepStartTime="2019-01-14T20:09:41.238Z"
    stepEndTime="2019-01-14T20:12:41.238Z"
    buildStats=stats
  }}`);

  return wait().then(() => {
    assert.ok(
      this.$('.line:first').text().trim().match(
        'Build created'
      )
    );
    assert.ok(
      this.$('.line:eq(1)').text().trim().match(
        'Build enqueued'
      )
    );
    assert.ok(
      this.$('.line:eq(2)').text().trim().match(
        'Build scheduled on node12.foo.bar.com'
      )
    );
    assert.ok(
      this.$('.line:last').text().trim().match(
        'Image pull completed'
      )
    );
  });
});

test('it generate logs for init step when build is blocked', function (assert) {
  this.set('stats', {
    queueEnterTime: '2019-01-14T20:10:41.238Z',
    blockedStartTime: '2019-01-14T20:10:42.238Z',
    imagePullStartTime: '2019-01-14T20:11:41.238Z',
    hostname: 'node12.foo.bar.com'
  });
  this.set('step', 'sd-setup-init');
  this.render(hbs`{{build-log
    stepName=step
    buildId=1
    buildStartTime="2019-01-14T20:12:41.238Z"
    stepStartTime="2019-01-14T20:09:41.238Z"
    stepEndTime="2019-01-14T20:12:41.238Z"
    buildStats=stats
  }}`);

  return wait().then(() => {
    assert.ok(
      this.$('.line:first').text().trim().match(
        'Build created'
      )
    );
    assert.ok(
      this.$('.line:eq(1)').text().trim().match(
        'Build enqueued'
      )
    );
    assert.ok(
      this.$('.line:eq(2)').text().trim().match(
        'Build blocked, putting back into queue'
      )
    );
    assert.ok(
      this.$('.line:eq(3)').text().trim().match(
        'Build scheduled on node12.foo.bar.com'
      )
    );
    assert.ok(
      this.$('.line:last').text().trim().match(
        'Image pull completed'
      )
    );
  });
});

test('it generate logs for failed init step', function (assert) {
  this.set('stats', {
    queueEnterTime: '2019-01-14T20:10:41.238Z',
    imagePullStartTime: '2019-01-14T20:11:41.238Z',
    hostname: 'node12.foo.bar.com'
  });
  this.set('step', 'sd-setup-init');
  this.render(hbs`{{build-log
    stepName=step
    buildId=1
    stepStartTime="2019-01-14T20:09:41.238Z"
    stepEndTime="2019-01-14T20:12:41.238Z"
    buildStartTime=""
    buildStats=stats
  }}`);

  return wait().then(() => {
    assert.ok(
      this.$('.line:first').text().trim().match(
        'Build created'
      )
    );
    assert.ok(
      this.$('.line:eq(1)').text().trim().match(
        'Build enqueued'
      )
    );
    assert.ok(
      this.$('.line:eq(2)').text().trim().match(
        'Build scheduled on node12.foo.bar.com'
      )
    );
    assert.ok(
      this.$('.line:last').text().trim().match(
        'Build init failed'
      )
    );
  });
});

test('it generate logs for init step with empty build stats', function (assert) {
  this.set('stats', {});
  this.set('step', 'sd-setup-init');
  this.render(hbs`{{build-log
    stepName=step
    buildId=1
    buildStartTime="2019-01-14T20:12:41.238Z"
    stepStartTime="2019-01-14T20:09:41.238Z"
    stepEndTime="2019-01-14T20:12:41.238Z"
    buildStats=stats
  }}`);

  return wait().then(() => {
    assert.ok(
      this.$('.line:first').text().trim().match(
        'Build created'
      )
    );
    assert.ok(
      this.$('.line:last').text().trim().match(
        'Build init done'
      )
    );
  });
});

test('it starts fetching more log for a chosen completed step', function (assert) {
  doneStub.onCall(0).returns(false);
  doneStub.onCall(1).returns(false);
  doneStub.onCall(2).returns(true);
  doneStub.onCall(3).returns(true);

  this.set('step', null);
  this.render(hbs`{{build-log
    stepName=step
    totalLine=1000
    buildId=1
    stepStartTime=null
    buildStartTime="1478912844724"
  }}`);

  assert.equal(this.$().text().trim(), 'Click a step to see logs');
  this.set('step', 'banana');

  const container = this.$('.wrap')[0];
  const lastScrollTop = container.scrollTop;

  run(() => { container.scrollTop = 0; });

  return wait().then(() => {
    sinon.assert.callCount(doneStub, 4);
    sinon.assert.callCount(logsStub, 4);
    assert.ok(container.scrollTop > lastScrollTop);
  });
});

test('it generates object url for the log when clicking download button', function (assert) {
  this.set('step', 'banana');
  this.render(hbs`{{build-log
    stepName=step
    totalLine=1000
    buildId=1
    stepStartTime=null
    buildStartTime="1478912844724"
  }}`);

  const $hiddenDownloadButton = this.$('#downloadLink');

  assert.equal($hiddenDownloadButton.prev().text().trim(), 'Download');

  $hiddenDownloadButton.prev().click();

  return wait().then(() => {
    assert.equal($hiddenDownloadButton.attr('href'), blobUrl);
  });
});
