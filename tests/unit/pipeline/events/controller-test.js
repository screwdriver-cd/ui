import EmberObject from '@ember/object';
import { A as newArray } from '@ember/array';
import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
    }
  }
});
let server;

moduleFor('controller:pipeline/events', 'Unit | Controller | pipeline/events', {
  // Specify the other units that are required for this test.
  // eslint-disable-next-line max-len
  needs: ['model:build', 'model:event', 'adapter:application', 'service:session', 'serializer:build', 'serializer:event'],
  beforeEach() {
    server = new Pretender();
    this.register('service:session', sessionServiceMock);
  },
  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  let controller = this.subject();

  assert.ok(controller);
});

test('it starts a build', function (assert) {
  assert.expect(7);
  server.post('http://localhost:8080/v4/events', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '5678',
      pipelineId: '1234'
    })
  ]);

  let controller = this.subject();

  run(() => {
    controller.set('pipeline', EmberObject.create({
      id: '1234'
    }));

    controller.set('reload', () => {
      assert.ok(true);

      return Promise.resolve({});
    });

    controller.set('model', {
      events: EmberObject.create({})
    });

    controller.transitionToRoute = (path, id) => {
      assert.equal(path, 'pipeline');
      assert.equal(id, 1234);
    };

    assert.notOk(controller.get('isShowingModal'));
    controller.send('startMainBuild');
    assert.ok(controller.get('isShowingModal'));
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: '~commit'
    });
  });
});

test('it restarts a build', function (assert) {
  assert.expect(6);
  server.post('http://localhost:8080/v4/events', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '2'
    })
  ]);

  let controller = this.subject();

  run(() => {
    controller.store.push({
      data: {
        id: '123',
        type: 'build',
        attributes: {
          parentBuildId: '345'
        }
      }
    });
    controller.set('selectedEventObj', {
      id: '1',
      sha: 'sha'
    });

    controller.set('pipeline', EmberObject.create({
      id: '1234'
    }));

    controller.set('reload', () => {
      assert.ok(true);

      return Promise.resolve({});
    });

    controller.set('model', {
      events: EmberObject.create({})
    });

    controller.transitionToRoute = (path) => {
      assert.equal(path, 'pipeline/1234/events');
    };

    assert.notOk(controller.get('isShowingModal'));
    controller.send('startDetachedBuild', { buildId: '123', name: 'deploy' });
    assert.ok(controller.get('isShowingModal'));
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: 'deploy',
      buildId: 123,
      parentBuildId: 345,
      parentEventId: 1,
      causeMessage: 'apple clicked restart for job "deploy" for sha sha'
    });
  });
});

test('it starts PR build(s)', function (assert) {
  const prNum = 999;

  assert.expect(5);
  server.post('http://localhost:8080/v4/events', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '5679',
      pipelineId: '1234'
    })
  ]);

  let controller = this.subject();

  const jobs = [{ hasMany: () => ({ reload: () => assert.ok(true) }) }];

  run(() => {
    controller.set('pipeline', EmberObject.create({
      id: '1234'
    }));

    controller.set('model', {
      events: EmberObject.create({})
    });

    assert.notOk(controller.get('isShowingModal'));
    controller.send('startPRBuild', prNum, jobs);
    assert.ok(controller.get('isShowingModal'));
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(controller.get('isShowingModal'));
    assert.deepEqual(payload, {
      causeMessage: `apple clicked start build for PR-${prNum}`,
      pipelineId: '1234',
      startFrom: '~pr',
      prNum
    });
  });
});

test('New event comes top of PR list when it starts a PR build with prChain', function (assert) {
  const prNum = 3;
  const jobs = [{ hasMany: () => ({ reload: () => assert.ok(true) }) }];

  assert.expect(5);

  server.post('http://localhost:8080/v4/events', () => [
    201,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      id: '2'
    })
  ]);

  const createRecordStub = sinon.stub();
  let controller = this.subject({
    store: {
      createRecord: createRecordStub
    }
  });

  const newEvent = EmberObject.create({
    id: 3,
    prNum: '3',
    sha: 'sha1',
    save: () => Promise.resolve(),
    get: () => Promise.resolve()
  });

  createRecordStub.returns(newEvent);

  run(() => {
    const event1 = EmberObject.create({
      id: '1',
      prNum: '2',
      sha: 'sha1'
    });
    const event2 = EmberObject.create({
      id: '2',
      prNum: '3',
      sha: 'sha2'
    });

    controller.set('prEvents', newArray([event1, event2]));

    controller.set('pipeline', EmberObject.create({
      id: '1234',
      prChain: true
    }));

    controller.set('model', {
      events: EmberObject.create({})
    });

    assert.notOk(controller.get('isShowingModal'));
    controller.send('startPRBuild', prNum, jobs);
    assert.ok(controller.get('isShowingModal'));
  });

  return wait().then(() => {
    assert.equal(controller.get('prEvents')[0].id, 3);
    assert.equal(controller.get('prEvents')[0].prNum, '3');
  });
});
