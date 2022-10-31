import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';
import sinon from 'sinon';
const startTime = 1478912844724;
const doneStub = sinon.stub();
const logsStub = sinon.stub();
const blobUrl = 'blob:https://localhost/34dba0dc-2706-4cae-a74f-99349a578e60';
const sampleLogs = Array(100)
  .fill()
  .map((_, i) => ({
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
  buildLogBlobUrl() {
    return blobUrl;
  },
  revokeLogBlobUrls() {}
});

module('Integration | Component | build log', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:build-logs', logService);
    doneStub.onCall(0).returns(true);
    doneStub.onCall(1).returns(false);
    logsStub.onCall(0).returns(sampleLogs);
    logsStub.onCall(1).returns(sampleLogs);
    logsStub.returns(sampleLogs.concat(sampleLogs));
  });

  hooks.afterEach(function () {
    doneStub.reset();
    logsStub.reset();
  });

  test('it displays some help when no step is selected', async function (assert) {
    await render(hbs`<BuildLog
      stepName=null
      @buildId=1
      @stepStartTime={{null}}
      @buildStartTime="1478912844724"
    />`);

    assert.dom('.logs').includesText('Click a step to see logs');

    // Template block usage:
    await render(hbs`<BuildLog
      @stepName={{null}}
      @buildId=1
      @stepStartTime={{null}}
      @buildStartTime="1478912844724"
    >
    template block text
    </BuildLog>`);

    assert.dom(this.element).includesText('template block text');
    assert.dom(this.element).includesText('Click a step to see logs');
  });

  test('it starts loading when step chosen', async function (assert) {
    this.set('step', null);
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @stepStartTime={{null}}
      @buildStartTime="1478912844724"
      @timeFormat="datetime"
    />`);

    assert.dom('.logs').includesText('Click a step to see logs');
    this.set('step', 'banana');

    return settled().then(() => {
      assert
        .dom('.line:first-child')
        .hasText(`${moment(startTime).format('HH:mm:ss')} ${startTime}`);
      assert
        .dom('.line:last-child')
        .hasText(
          `${moment(startTime + 99).format('HH:mm:ss')} ${startTime + 99}`
        );
    });
  });

  test('it generate logs for init step', async function (assert) {
    this.set('stats', {
      queueEnterTime: '2019-01-14T20:10:41.238Z',
      imagePullStartTime: '2019-01-14T20:11:41.238Z',
      hostname: 'node12.foo.bar.com'
    });
    this.set('step', 'sd-setup-init');
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @buildStartTime="2019-01-14T20:12:41.238Z"
      @stepStartTime="2019-01-14T20:09:41.238Z"
      @stepEndTime="2019-01-14T20:12:41.238Z"
      @buildStats={{this.stats}}
    />`);

    return settled().then(() => {
      assert.dom('.line:first-child').includesText('Build created');
      assert.dom('.line:nth-child(2)').includesText('Build enqueued');
      assert
        .dom('.line:nth-child(3)')
        .includesText('Build scheduled on node12.foo.bar.com');
      assert.dom('.line:last-child').includesText('Image pull completed');
    });
  });

  test('it generate logs for init step with parameters', async function (assert) {
    this.owner.unregister('service:store');
    const storeStub = Service.extend({
      peekRecord() {
        return {
          meta: {
            parameters: {
              p1: {
                value: 'p1'
              },
              p2: {
                value: 'p2'
              }
            }
          }
        };
      }
    });

    this.owner.register('service:store', storeStub);
    this.setProperties({
      step: 'sd-setup-init',
      buildId: 1,
      stats: {
        queueEnterTime: '2019-01-14T20:10:41.238Z',
        imagePullStartTime: '2019-01-14T20:11:41.238Z',
        hostname: 'node12.foo.bar.com'
      }
    });

    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @buildStartTime="2019-01-14T20:12:41.238Z"
      @stepStartTime="2019-01-14T20:09:41.238Z"
      @stepEndTime="2019-01-14T20:12:41.238Z"
      @buildStats={{this.stats}}
    />`);

    return settled().then(() => {
      assert.dom('.line:first-child').includesText('Build created');
      assert.dom('.line:nth-child(2)').includesText('Build parameters');
      assert.dom('.line:nth-child(3)').includesText('Build enqueued');
      assert
        .dom('.line:nth-child(4)')
        .includesText('Build scheduled on node12.foo.bar.com');
      assert.dom('.line:last-child').includesText('Image pull completed');
    });
  });

  test('it generate logs for init step when build is blocked', async function (assert) {
    this.set('stats', {
      queueEnterTime: '2019-01-14T20:10:41.238Z',
      blockedStartTime: '2019-01-14T20:10:42.238Z',
      imagePullStartTime: '2019-01-14T20:11:41.238Z',
      hostname: 'node12.foo.bar.com'
    });
    this.set('step', 'sd-setup-init');
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @buildStartTime="2019-01-14T20:12:41.238Z"
      @stepStartTime="2019-01-14T20:09:41.238Z"
      @stepEndTime="2019-01-14T20:12:41.238Z"
      @buildStats={{this.stats}}
    />`);

    return settled().then(() => {
      assert.dom('.line:first-child').includesText('Build created');
      assert.dom('.line:nth-child(2)').includesText('Build enqueued');
      assert
        .dom('.line:nth-child(3)')
        .includesText('Build blocked, putting back into queue');
      assert
        .dom('.line:nth-child(4)')
        .includesText('Build scheduled on node12.foo.bar.com');
      assert.dom('.line:last-child').includesText('Image pull completed');
    });
  });

  test('it generate logs for COLLAPSED build', async function (assert) {
    this.set('stats', {
      queueEnterTime: '2019-01-14T20:10:41.238Z'
    });
    this.set('step', 'sd-setup-init');
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @buildStartTime="2019-01-14T20:12:41.238Z"
      @stepStartTime="2019-01-14T20:09:41.238Z"
      @stepEndTime="2019-01-14T20:12:41.238Z"
      @buildStats={{this.stats}}
      @buildStatus="COLLAPSED"
    />`);

    return settled().then(() => {
      assert.dom('.line:first-child').includesText('Build created');
      assert
        .dom('.line:last-child')
        .includesText('Build collapsed and removed from the queue.');
    });
  });

  test('it generate logs for FROZEN build', async function (assert) {
    this.set('step', 'sd-setup-init');
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @buildStartTime="2019-01-14T20:12:41.238Z"
      @stepStartTime="2019-01-14T20:09:41.238Z"
      @stepEndTime="2019-01-14T20:12:41.238Z"
      @buildStats={{this.stats}}
      @buildStatus="FROZEN"
    />`);

    return settled().then(() => {
      assert.dom('.line:first-child').includesText('Build created');
      assert
        .dom('.line:last-child')
        .includesText('Build frozen and removed from the queue.');
    });
  });

  test('it generate logs for failed init step', async function (assert) {
    this.set('stats', {
      queueEnterTime: '2019-01-14T20:10:41.238Z',
      imagePullStartTime: '2019-01-14T20:11:41.238Z',
      hostname: 'node12.foo.bar.com'
    });
    this.set('step', 'sd-setup-init');
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @stepStartTime="2019-01-14T20:09:41.238Z"
      @stepEndTime="2019-01-14T20:12:41.238Z"
      @buildStartTime=""
      @buildStats={{this.stats}}
    />`);

    return settled().then(() => {
      assert.dom('.line:first-child').includesText('Build created');
      assert.dom('.line:nth-child(2)').includesText('Build enqueued');
      assert
        .dom('.line:nth-child(3)')
        .includesText('Build scheduled on node12.foo.bar.com');
      assert.dom('.line:last-child').includesText('Build init failed');
    });
  });

  test('it generate logs for init step with empty build stats', async function (assert) {
    this.set('stats', {});
    this.set('step', 'sd-setup-init');
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @buildId=1
      @buildStartTime="2019-01-14T20:12:41.238Z"
      @stepStartTime="2019-01-14T20:09:41.238Z"
      @stepEndTime="2019-01-14T20:12:41.238Z"
      @buildStats={{this.stats}}
    />`);

    return settled().then(() => {
      assert.dom('.line:first-child').includesText('Build created');
      assert.dom('.line:last-child').includesText('Build init done');
    });
  });

  test('it starts fetching more log for a chosen completed step', async function (assert) {
    doneStub.onCall(0).returns(false);
    doneStub.onCall(1).returns(false);
    doneStub.onCall(2).returns(true);
    doneStub.onCall(3).returns(true);

    this.set('step', null);
    this.set('scrollStill', sinon.stub());
    await render(hbs`<BuildLog
      @stepName={{this.step}}
      @totalLine=1000
      @buildId=1
      @stepStartTime={{null}}
      @buildStartTime="1478912844724"
      @timeFormat="datetime"
    />`);

    assert.dom('.logs').hasText('Click a step to see logs');
    this.set('step', 'banana');

    const container = find('.wrap');
    const lastScrollTop = container.scrollTop;

    container.scrollTop = 0;

    return settled().then(() => {
      sinon.assert.called(doneStub);
      sinon.assert.called(logsStub);
      assert.ok(container.scrollTop > lastScrollTop);
    });
  });
});
