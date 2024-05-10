import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import EmberObject from '@ember/object';
import { render, waitUntil } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { A as newArray } from '@ember/array';
import { run } from '@ember/runloop';
import Pretender from 'pretender';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import sinon from 'sinon';

const latestCommitEvent = {
  id: 3,
  sha: 'sha3'
};

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      // fake token for test, it has { username: apple } inside
      // eslint-disable-next-line max-len
      token:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
    }
  }
});

let server;

module('Integration | Component | pipeline events', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
    const shuttleStub = Service.extend({
      getLatestCommitEvent() {
        return new EmberPromise(resolve => resolve(latestCommitEvent));
      },
      getUserSetting() {
        return [];
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it starts a build', async function (assert) {
    assert.expect(7);
    server.get('http://localhost:8080/v4/events/5678/builds', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{ id: '1234' }])
    ]);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '5678',
        pipelineId: '1234'
      })
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    run(() => {
      component.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      component.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      component.set('model', {
        events: newArray()
      });

      const routerServiceMock = Service.extend({
        transitionTo: (path, id) => {
          assert.equal(path, 'pipeline');
          assert.deepEqual(id, '1234');
        }
      });

      this.owner.unregister('service:router');
      this.owner.register('service:router', routerServiceMock);

      assert.notOk(component.isShowingModal);
      component.send('startMainBuild');
      assert.ok(component.isShowingModal);
    });

    await waitUntil(() => !component.isShowingModal);

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(component.isShowingModal);
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: '~commit',
      causeMessage: 'Manually started by apple'
    });
  });

  test('it restarts a build', async function (assert) {
    assert.expect(7);
    server.get('http://localhost:8080/v4/events/2/builds', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{ id: '1234' }])
    ]);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2'
      })
    ]);
    server.put('http://localhost:8080/v4/events/5678', () => []);

    const component = this.owner.lookup('component:pipeline-events');

    run(() => {
      component.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            parentBuildId: '345'
          }
        }
      });

      component.set('previousModelEvents', [
        {
          id: '1',
          sha: 'sha',
          pipelineId: '1234'
        }
      ]);

      component.set('selected', '1');

      component.set('activeTab', 'events');

      component.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      component.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      component.set('model', {
        events: newArray()
      });

      const routerServiceMock = Service.extend({
        transitionTo: (routeName, pipelineId) => {
          assert.equal(routeName, 'pipeline');
          assert.equal(pipelineId, 1234);
        }
      });

      this.owner.unregister('service:router');
      this.owner.register('service:router', routerServiceMock);

      assert.notOk(component.isShowingModal);
      component.send('startDetachedBuild', { buildId: '123', name: 'deploy' });
      assert.ok(component.isShowingModal);
    });

    await waitUntil(() => !component.isShowingModal);

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(component.isShowingModal);
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: 'deploy',
      buildId: 123,
      parentBuildId: 345,
      parentEventId: 1,
      causeMessage: 'Manually started by apple'
    });
  });

  test('it restarts a PR build', async function (assert) {
    assert.expect(7);
    server.get('http://localhost:8080/v4/events/2/builds', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{ id: '1234' }])
    ]);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2'
      })
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    run(() => {
      component.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            parentBuildId: '345'
          }
        }
      });

      component.set('model', {
        events: [
          {
            id: '1',
            prNum: 3,
            createTime: '2016-09-15T23:12:23.760Z',
            workflowGraph: {
              nodes: [
                { name: '~pr' },
                { name: '~commit' },
                { name: 'pull-request1', id: 2071771 },
                { name: 'pull-request2', id: 2071772 },
                { name: 'component', id: 2071773 }
              ],
              edges: [
                { src: '~pr', dest: 'pull-request1' },
                { src: '~pr', dest: 'pull-request2' },
                { src: 'pull-request2', dest: 'component' }
              ]
            }
          }
        ]
      });

      component.set('selected', '1');

      component.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      component.set('activeTab', 'pulls');

      component.set('reload', () => {
        assert.ok(true);

        return Promise.resolve({});
      });

      const routerServiceMock = Service.extend({
        transitionTo: (routeName, pipelineId) => {
          assert.equal(routeName, 'pipeline.pulls');
          assert.equal(pipelineId, 1234);
        }
      });

      this.owner.unregister('service:router');
      this.owner.register('service:router', routerServiceMock);

      assert.notOk(component.isShowingModal);
      component.send('startDetachedBuild', { buildId: '123', name: 'deploy' });
      assert.ok(component.isShowingModal);
    });

    await waitUntil(() => !component.isShowingModal);

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(component.isShowingModal);
    assert.deepEqual(payload, {
      pipelineId: '1234',
      startFrom: 'PR-3:deploy',
      buildId: 123,
      parentBuildId: 345,
      parentEventId: 1,
      causeMessage: 'Manually started by apple'
    });
  });

  test('it stops a build', async function (assert) {
    assert.expect(3);
    server.put('http://localhost:8080/v4/builds/123', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '123'
      })
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    const job = {
      buildId: '123',
      name: 'deploy'
    };

    const event = {
      hasMany: () => ({ reload: () => assert.ok(true) }),
      id: '123'
    };

    run(() => {
      component.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            status: 'RUNNING'
          }
        }
      });

      component.set('model', {
        events: newArray()
      });

      const build = component.store.peekRecord('build', '123');

      build.set('status', 'ABORTED');
      build.save();

      component.send('stopBuild', event, job);
    });

    await waitUntil(() => !component.isShowingModal);

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(component.isShowingModal);
    assert.deepEqual(payload, {
      status: 'ABORTED'
    });
  });

  test('it stops PR build(s)', async function (assert) {
    assert.expect(1);
    server.put('http://localhost:8080/v4/builds/123', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '123'
      })
    ]);
    server.put('http://localhost:8080/v4/events/123/stop', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '123'
      })
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    const jobs = newArray([
      {
        builds: [
          {
            eventId: 123
          }
        ]
      }
    ]);

    run(() => {
      component.store.push({
        data: {
          id: '123',
          type: 'build',
          attributes: {
            status: 'RUNNING'
          }
        }
      });

      component.set('model', {
        events: newArray()
      });

      const build = component.store.peekRecord('build', '123');

      build.set('status', 'ABORTED');
      build.save();

      component.send('stopPRBuilds', jobs);
    });

    await waitUntil(() => !component.isShowingModal);

    const [request] = server.handledRequests;
    const { responseText } = request;
    const payload = JSON.parse(responseText);

    assert.deepEqual(payload, {
      id: '123'
    });
  });

  test('it starts PR build(s)', async function (assert) {
    const prNum = 999;

    assert.expect(6);
    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '5679',
        pipelineId: '1234'
      })
    ]);
    server.get('http://localhost:8080/v4/events/5679/builds', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{ id: '1234' }])
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    const jobs = [
      {
        hasMany: () => ({ reload: () => assert.ok(true) }),
        notifyPropertyChange: key => assert.equal(key, 'builds')
      }
    ];

    run(() => {
      component.set(
        'pipeline',
        EmberObject.create({
          id: '1234'
        })
      );

      component.set('model', {
        events: newArray()
      });

      assert.notOk(component.isShowingModal);
      component.send('startPRBuild', prNum, jobs);
      assert.ok(component.isShowingModal);
    });

    await waitUntil(() => !component.isShowingModal);

    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.notOk(component.isShowingModal);
    assert.deepEqual(payload, {
      causeMessage: 'Manually started by apple',
      pipelineId: '1234',
      startFrom: '~pr',
      prNum
    });
  });

  test('New event comes top of PR list when it starts a PR build with prChain', async function (assert) {
    const prNum = 3;
    const jobs = [
      {
        hasMany: () => ({ reload: () => assert.ok(true) }),
        notifyPropertyChange: key => assert.equal(key, 'builds')
      }
    ];

    assert.expect(6);

    server.post('http://localhost:8080/v4/events', () => [
      201,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2'
      })
    ]);

    const newEvent = EmberObject.create({
      id: 3,
      prNum: '3',
      sha: 'sha1',
      save: () => Promise.resolve(),
      get: () => Promise.resolve()
    });

    const storeServiceMock = Service.extend({
      createRecord: sinon.stub().returns(newEvent)
    });

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeServiceMock);

    const component = this.owner.lookup('component:pipeline-events');

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

      component.set('model', {
        events: newArray([event1, event2])
      });

      component.set(
        'pipeline',
        EmberObject.create({
          id: '1234',
          prChain: true
        })
      );

      assert.notOk(component.isShowingModal);
      component.send('startPRBuild', prNum, jobs);
      assert.ok(component.isShowingModal);
    });

    await waitUntil(() => !component.isShowingModal);

    const { prEvents } = component;

    assert.equal(prEvents[0].id, 3);
    assert.equal(prEvents[0].prNum, '3');
  });

  test('From no admins to have admins after sync', async function (assert) {
    assert.expect(4);

    const pipelineData = {
      id: 1234,
      name: 'adong/fp-www',
      scmUri: 'git.example.com:488454:adong/x',
      scmContext: 'github:git.example.com',
      scmRepo: {
        branch: 'adong/x',
        name: 'adong/fp-www',
        url: 'https://git.example.com/adong/fp-www/tree/adong/x',
        rootDir: '',
        private: false
      },
      createTime: '2021-03-30T17:08:32.581Z',
      admins: {},
      workflowGraph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'pull-request1', id: 2071771 },
          { name: 'pull-request2', id: 2071772 },
          { name: 'component', id: 2071773 }
        ],
        edges: [
          { src: '~pr', dest: 'pull-request1' },
          { src: '~pr', dest: 'pull-request2' },
          { src: 'pull-request2', dest: 'component' }
        ]
      },
      annotations: { 'screwdriver.cd/buildCluster': 'gq1' },
      lastEventId: 14412878,
      prChain: false,
      parameters: {},
      subscribedScmUrlsWithActions: []
    };
    const adminsData = { adong: true };

    server.get('http://localhost:8080/v4/pipelines/1234', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(pipelineData)
    ]);

    server.post('http://localhost:8080/v4/pipelines/1234/sync/', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    const component = this.owner.lookup('component:pipeline-events');
    const pipeline = await component.store.findRecord('pipeline', 1234);

    component.set('pipeline', pipeline);

    assert.notOk(component.hasAdmins, 'has no admins');
    assert.deepEqual(
      component.get('pipeline.admins'),
      {},
      'pipeline admins is empty'
    );

    run(() => {
      // add admins data
      server.get('http://localhost:8080/v4/pipelines/1234', () => [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({ ...pipelineData, admins: adminsData })
      ]);

      component.send('syncAdmins');
    });

    await waitUntil(() => component.pipeline.admins.adong);

    assert.ok(component.hasAdmins, 'now has admins');
    assert.deepEqual(
      component.get('pipeline.admins'),
      adminsData,
      'pipeline admins is NOT empty'
    );
  });

  test('it handles job enabling', async function (assert) {
    server.put('http://localhost:8080/v4/jobs/1234', () => [
      200,
      {},
      JSON.stringify({})
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    run(() => {
      component.store.push({
        data: {
          id: '1234',
          type: 'job',
          attributes: {
            state: 'DISABLED',
            stateChangeMessage: 'foo'
          }
        }
      });

      component.send('setJobState', 1234, 'ENABLED', 'testing');
    });

    await waitUntil(() => server.handledRequest.length);

    const job = await component.store.peekRecord('job', 1234);
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.equal(job.state, 'ENABLED');
    assert.equal(job.stateChangeMessage, 'testing');
    assert.equal(payload.state, 'ENABLED');
    assert.equal(payload.stateChangeMessage, 'testing');
  });

  test('it handles job disabling', async function (assert) {
    server.put('http://localhost:8080/v4/jobs/1234', () => [
      200,
      {},
      JSON.stringify({})
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    run(() => {
      component.store.push({
        data: {
          id: '1234',
          type: 'job',
          attributes: {
            state: 'ENABLED',
            stateChangeMessage: 'foo'
          }
        }
      });

      component.send('setJobState', 1234, 'DISABLED', 'testing');
    });

    await waitUntil(() => server.handledRequest.length);

    const job = await component.store.peekRecord('job', 1234);
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.equal(job.state, 'DISABLED');
    assert.equal(job.stateChangeMessage, 'testing');
    assert.equal(payload.state, 'DISABLED');
    assert.equal(payload.stateChangeMessage, 'testing');
  });

  test('it fails to handle job enabling', async function (assert) {
    server.put('http://localhost:8080/v4/jobs/1234', () => [
      403,
      {},
      JSON.stringify({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Test Error'
      })
    ]);

    const component = this.owner.lookup('component:pipeline-events');

    run(() => {
      component.store.push({
        data: {
          id: '1234',
          type: 'job',
          attributes: {
            state: 'DISABLED',
            stateChangeMessage: 'foo'
          }
        }
      });

      component.send('setJobState', 1234, 'ENABLED', 'testing');
    });

    await waitUntil(() => component.errorMessage);

    const job = await component.store.peekRecord('job', 1234);
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.equal(job.state, 'DISABLED');
    assert.equal(job.stateChangeMessage, 'foo');
    assert.equal(payload.state, 'ENABLED');
    assert.equal(payload.stateChangeMessage, 'testing');
    assert.equal(component.errorMessage, 'Test Error');
  });

  test('it filters scheduled build', async function (assert) {
    const filterSchedulerEvents = true;
    const pipelineData = {
      id: 11326,
      name: 'adong/sd-periodic',
      scmUri: 'github.com:630153541:main',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'main',
        name: 'adong/sd-periodic',
        url: 'https://github.com/adong/sd-periodic/tree/main',
        rootDir: '',
        private: false
      },
      createTime: '2023-04-19T19:29:03.576Z',
      admins: { adong: true },
      workflowGraph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'main', id: 98321 }
        ],
        edges: [
          { src: '~commit', dest: 'main' },
          { src: '~pr', dest: 'main' }
        ]
      },
      annotations: { 'screwdriver.cd/buildCluster': 'bf1' },
      lastEventId: 735442,
      prChain: false,
      parameters: {},
      settings: { filterSchedulerEvents },
      state: 'ACTIVE',
      subscribedScmUrlsWithActions: []
    };
    const events1 = [
      {
        id: 735442,
        groupEventId: 735442,
        causeMessage: 'Merged by adong',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
        },
        createTime: '2023-04-20T16:57:21.936Z',
        creator: {
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        meta: {
          build: {
            buildId: '858092',
            coverageKey: 'job:98321',
            eventId: '735442',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: 'screwdriver.yaml',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          event: { creator: 'adong' }
        },
        pipelineId: 11326,
        sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        configPipelineSha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        startFrom: '~commit',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {},
        baseBranch: 'main'
      },
      {
        id: 735440,
        groupEventId: 735440,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T16:40:09.509Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858089',
            coverageKey: 'job:98321',
            eventId: '735440',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735433,
        groupEventId: 735433,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T15:40:07.455Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858082',
            coverageKey: 'job:98321',
            eventId: '735433',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735425,
        groupEventId: 735425,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T14:40:08.520Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858077',
            coverageKey: 'job:98321',
            eventId: '735425',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735415,
        groupEventId: 735415,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T13:40:05.477Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858069',
            coverageKey: 'job:98321',
            eventId: '735415',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      }
    ];
    const events2 = [
      {
        id: 735398,
        groupEventId: 735398,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T12:40:09.382Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858052',
            coverageKey: 'job:98321',
            eventId: '735398',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735385,
        groupEventId: 735385,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T11:40:03.775Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858039',
            coverageKey: 'job:98321',
            eventId: '735385',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735374,
        groupEventId: 735374,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T10:40:08.115Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858027',
            coverageKey: 'job:98321',
            eventId: '735374',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735361,
        groupEventId: 735361,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T09:40:05.733Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858015',
            coverageKey: 'job:98321',
            eventId: '735361',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735344,
        groupEventId: 735344,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T08:40:08.636Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858000',
            coverageKey: 'job:98321',
            eventId: '735344',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      }
    ];

    server.get('http://localhost:8080/v4/pipelines/11326', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(pipelineData)
    ]);

    server.get('http://localhost:8080/v4/events/735254', () => [
      200,
      {},
      JSON.stringify({
        id: 735254,
        groupEventId: 735254,
        causeMessage: 'Manually started by adong',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-19T19:29:11.770Z',
        creator: {
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        meta: {
          build: {
            buildId: '857909',
            coverageKey: 'job:98321',
            eventId: '735254',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'adong' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: '~commit',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/11326/events', request => {
      // const count = parseInt(request.queryParams.count, 10);
      const page = parseInt(request.queryParams.page, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(page === '1' ? events1 : events2)
      ];
    });

    server.get('http://localhost:8080/v4/pipelines/11326/jobs', () => [
      200,
      {},
      JSON.stringify([
        {
          id: 98321,
          name: 'main',
          permutations: [
            {
              annotations: {},
              commands: [{ name: 'step-1', command: 'ls' }],
              environment: {},
              image: 'node:18',
              secrets: [],
              settings: {},
              requires: ['~commit', '~pr']
            }
          ],
          pipelineId: 11326,
          state: 'ENABLED',
          archived: false
        }
      ])
    ]);

    const component = this.owner.lookup('component:pipeline-events');
    const pipeline = await component.store.findRecord('pipeline', 11326);

    this.setProperties({
      pipeline,
      showPRJobs: true,
      model: {
        pipelinePreference: [],
        desiredJobNameLengthjobs: 20,
        triggers: [{ jobName: 'main', triggers: [] }],
        events: events1
      },
      selected: '735254',
      activeTab: 'events',
      paginateEvents: events1,
      eventsPage: 2,
      expandedEventsGroup: {},
      latestCommit: {
        id: 735442,
        groupEventId: 735442,
        causeMessage: 'Merged by adong',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
        },
        createTime: '2023-04-20T16:57:21.936Z',
        creator: {
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        meta: {
          build: {
            buildId: '858092',
            coverageKey: 'job:98321',
            eventId: '735442',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: 'screwdriver.yaml',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          event: { creator: 'adong' }
        },
        pipelineId: 11326,
        sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        configPipelineSha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        startFrom: '~commit',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {},
        baseBranch: 'main'
      }
    });

    await render(hbs`<PipelineEvents
      @session={{this.session}}
      @model={{this.model}}
      @pipeline={{this.pipeline}}
      @showPRJobs={{this.showPRJobs}}
      @selected={{mut this.selected}}
      @showListView={{false}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @jobId={{this.jobId}}
      @showPRJobs={{this.showPRJobs}}
      @activeTab={{this.activeTab}}
      @expandedEventsGroup={{mut this.expandedEventsGroup}}
      @paginateEvents={{mut this.paginateEvents}}
      @eventsPage={{this.eventsPage}}
      @isShowingModal={{false}}
    />`);

    assert.equal(
      this.element.querySelectorAll('div.status').length,
      1,
      'only has one event which is not triggered by sd scheduler'
    );
  });

  test('it will not filter scheduled build', async function (assert) {
    const filterSchedulerEvents = false;
    const pipelineData = {
      id: 11326,
      name: 'adong/sd-periodic',
      scmUri: 'github.com:630153541:main',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'main',
        name: 'adong/sd-periodic',
        url: 'https://github.com/adong/sd-periodic/tree/main',
        rootDir: '',
        private: false
      },
      createTime: '2023-04-19T19:29:03.576Z',
      admins: { adong: true },
      workflowGraph: {
        nodes: [
          { name: '~pr' },
          { name: '~commit' },
          { name: 'main', id: 98321 }
        ],
        edges: [
          { src: '~commit', dest: 'main' },
          { src: '~pr', dest: 'main' }
        ]
      },
      annotations: { 'screwdriver.cd/buildCluster': 'bf1' },
      lastEventId: 735442,
      prChain: false,
      parameters: {},
      settings: { filterSchedulerEvents },
      state: 'ACTIVE',
      subscribedScmUrlsWithActions: []
    };
    const events1 = [
      {
        id: 735442,
        groupEventId: 735442,
        causeMessage: 'Merged by adong',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
        },
        createTime: '2023-04-20T16:57:21.936Z',
        creator: {
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        meta: {
          build: {
            buildId: '858092',
            coverageKey: 'job:98321',
            eventId: '735442',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: 'screwdriver.yaml',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          event: { creator: 'adong' }
        },
        pipelineId: 11326,
        sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        configPipelineSha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        startFrom: '~commit',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {},
        baseBranch: 'main'
      },
      {
        id: 735440,
        groupEventId: 735440,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T16:40:09.509Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858089',
            coverageKey: 'job:98321',
            eventId: '735440',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735433,
        groupEventId: 735433,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T15:40:07.455Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858082',
            coverageKey: 'job:98321',
            eventId: '735433',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735425,
        groupEventId: 735425,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T14:40:08.520Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858077',
            coverageKey: 'job:98321',
            eventId: '735425',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      },
      {
        id: 735415,
        groupEventId: 735415,
        causeMessage: 'Started by periodic build scheduler',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-20T13:40:05.477Z',
        creator: { name: 'Screwdriver scheduler', username: 'sd:scheduler' },
        meta: {
          build: {
            buildId: '858069',
            coverageKey: 'job:98321',
            eventId: '735415',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'sd:scheduler' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: 'main',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      }
    ];
    const events2 = [];

    server.get('http://localhost:8080/v4/pipelines/11326', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(pipelineData)
    ]);

    server.get('http://localhost:8080/v4/events/735254', () => [
      200,
      {},
      JSON.stringify({
        id: 735254,
        groupEventId: 735254,
        causeMessage: 'Manually started by adong',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
        },
        createTime: '2023-04-19T19:29:11.770Z',
        creator: {
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        meta: {
          build: {
            buildId: '857909',
            coverageKey: 'job:98321',
            eventId: '735254',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: '',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/439c9f91ff65aee5a698c710206f1ff64f1e5a54'
          },
          event: { creator: 'adong' }
        },
        pipelineId: 11326,
        sha: '439c9f91ff65aee5a698c710206f1ff64f1e5a54',
        startFrom: '~commit',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {}
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/11326/events', request => {
      // const count = parseInt(request.queryParams.count, 10);
      const page = parseInt(request.queryParams.page, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(page === '1' ? events1 : events2)
      ];
    });

    server.get('http://localhost:8080/v4/pipelines/11326/jobs', () => [
      200,
      {},
      JSON.stringify([
        {
          id: 98321,
          name: 'main',
          permutations: [
            {
              annotations: {},
              commands: [{ name: 'step-1', command: 'ls' }],
              environment: {},
              image: 'node:18',
              secrets: [],
              settings: {},
              requires: ['~commit', '~pr']
            }
          ],
          pipelineId: 11326,
          state: 'ENABLED',
          archived: false
        }
      ])
    ]);

    const component = this.owner.lookup('component:pipeline-events');
    const pipeline = await component.store.findRecord('pipeline', 11326);

    this.setProperties({
      pipeline,
      showPRJobs: true,
      model: {
        pipelinePreference: [],
        desiredJobNameLengthjobs: 20,
        triggers: [{ jobName: 'main', triggers: [] }],
        events: events1
      },
      selected: '735254',
      activeTab: 'events',
      paginateEvents: events1,
      eventsPage: 2,
      expandedEventsGroup: {},
      latestCommit: {
        id: 735442,
        groupEventId: 735442,
        causeMessage: 'Merged by adong',
        commit: {
          author: {
            avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
            name: 'Alan',
            username: 'adong',
            url: 'https://github.com/adong'
          },
          committer: {
            avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
            name: 'GitHub Web Flow',
            username: 'web-flow',
            url: 'https://github.com/web-flow'
          },
          message: 'Update screwdriver.yaml',
          url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
        },
        createTime: '2023-04-20T16:57:21.936Z',
        creator: {
          avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
          name: 'Alan',
          username: 'adong',
          url: 'https://github.com/adong'
        },
        meta: {
          build: {
            buildId: '858092',
            coverageKey: 'job:98321',
            eventId: '735442',
            jobId: '98321',
            jobName: 'main',
            pipelineId: '11326',
            sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          commit: {
            author: {
              avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
              name: 'Alan',
              url: 'https://github.com/adong',
              username: 'adong'
            },
            changedFiles: 'screwdriver.yaml',
            committer: {
              avatar: 'https://avatars.githubusercontent.com/u/19864447?v=4',
              name: 'GitHub Web Flow',
              url: 'https://github.com/web-flow',
              username: 'web-flow'
            },
            message: 'Update screwdriver.yaml',
            url: 'https://github.com/adong/sd-periodic/commit/b549aa9502292ddb0894cfb88ced6cc144ed2a76'
          },
          event: { creator: 'adong' }
        },
        pipelineId: 11326,
        sha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        configPipelineSha: 'b549aa9502292ddb0894cfb88ced6cc144ed2a76',
        startFrom: '~commit',
        type: 'pipeline',
        workflowGraph: {
          nodes: [
            { name: '~pr' },
            { name: '~commit' },
            { name: 'main', id: 98321 }
          ],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: '~pr', dest: 'main' }
          ]
        },
        pr: {},
        baseBranch: 'main'
      }
    });

    await render(hbs`<PipelineEvents
      @session={{this.session}}
      @model={{this.model}}
      @pipeline={{this.pipeline}}
      @showPRJobs={{this.showPRJobs}}
      @selected={{mut this.selected}}
      @showListView={{false}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @jobId={{this.jobId}}
      @showPRJobs={{this.showPRJobs}}
      @activeTab={{this.activeTab}}
      @expandedEventsGroup={{mut this.expandedEventsGroup}}
      @paginateEvents={{mut this.paginateEvents}}
      @eventsPage={{this.eventsPage}}
      @isShowingModal={{false}}
    />`);

    assert.equal(
      this.element.querySelectorAll('div.status').length,
      5,
      'will have 5 events including triggered by sd scheduler'
    );
  });
});
