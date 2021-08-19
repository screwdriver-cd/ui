import sinonTest from 'ember-sinon-qunit/test-support/test';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';
import sinon from 'sinon';

let server;

const jobName = 'main';
const pipelineId = 123;
const buildId = 456;
const buildStatus = 'SUCCESS';
const params = {
  job_name: jobName,
  status: buildStatus
};
const transition = {
  params: {
    pipeline: {
      pipeline_id: pipelineId
    }
  }
};
const latestBuild = {
  id: buildId,
  pipelineId
};
const sessionServiceMock = Service.extend({
  isAuthenticated: false,
  data: {
    authenticated: {
      token: 'banana'
    }
  }
});

module('Unit | Route | pipeline/job-latest-build', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
    this.session = this.owner.lookup('service:session');
    this.session.set('isAuthenticated', false);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:pipeline/job-latest-build');

    assert.ok(route);
  });

  sinonTest('it rejects if the user is not authenticated', function (assert) {
    assert.expect(3);

    const route = this.owner.lookup('route:pipeline/job-latest-build');
    const paramsForStub = sinon
      .stub(route, 'paramsFor')
      .callsFake(() => ({ pipeline_id: 123 }));
    const p = route.model(params, transition);

    p.catch(e => {
      assert.ok(paramsForStub.called, 'paramsFor got called');
      assert.ok(e instanceof Error, e);
      assert.equal('User is not authenticated', e.message);
    });
  });

  sinonTest(
    'it makes call to get latest build successfully',
    function (assert) {
      assert.expect(3);
      this.session.set('isAuthenticated', true);
      server.get(
        'http://localhost:8080/v4/pipelines/123/jobs/main/latestBuild',
        request => {
          if (request.queryParams.status === 'SUCCESS') {
            return [
              200,
              {
                'Content-Type': 'application/json'
              },
              JSON.stringify({ id: 456 })
            ];
          }

          return [
            200,
            {
              'Content-Type': 'application/json'
            },
            JSON.stringify({ id: 100 })
          ];
        }
      );

      const route = this.owner.lookup('route:pipeline/job-latest-build');
      const paramsForStub = sinon
        .stub(route, 'paramsFor')
        .callsFake(() => ({ pipeline_id: 123 }));

      const p = route.model(params, transition);

      p.then(data => {
        const [request] = server.handledRequests;

        assert.ok(paramsForStub.called, 'paramsFor got called');
        assert.deepEqual(
          request.url,
          'http://localhost:8080/v4/pipelines/123/jobs/main/latestBuild?status=SUCCESS',
          'called with right url'
        );
        assert.deepEqual(data, latestBuild);
      });
    }
  );
});
