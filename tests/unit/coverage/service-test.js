import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';

const sessionStub = Service.extend({
  data: {
    authenticated: {
      token: 'faketoken'
    }
  }
});

let server;

module('Unit | Service | coverage ', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionStub);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it fetches coverage info', function(assert) {
    assert.expect(3);
    server.get('http://localhost:8080/v4/coverage/info', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify({
        coverage: 98,
        projectUrl: 'https://sonar.foo.bar',
        tests: '7/10'
      })
    ]);

    let service = this.owner.lookup('service:coverage');

    assert.ok(service);

    const config = {
      buildId: 123,
      jobId: 1,
      startTime: '2018-05-10T19:05:53.123Z',
      endTime: '2018-05-10T19:06:53.123Z',
      pipelineId: 456,
      prNum: 5,
      jobName: 'main',
      pipelineName: 'd2lam/mytest'
    };

    const p = service.getCoverageInfo(config);

    p.then(data => {
      const [request] = server.handledRequests;

      assert.deepEqual(data, {
        coverage: '98%',
        coverageUrl: 'https://sonar.foo.bar',
        tests: '7/10',
        testsUrl: 'https://sonar.foo.bar'
      });
      assert.deepEqual(
        request.url,
        // eslint-disable-next-line max-len
        'http://localhost:8080/v4/coverage/info?buildId=123&jobId=1&startTime=2018-05-10T19%3A05%3A53.123Z&endTime=2018-05-10T19%3A06%3A53.123Z&pipelineId=456&prNum=5&jobName=main&pipelineName=d2lam%2Fmytest'
      );
    });
  });

  test('it fetches coverage info with scope', function(assert) {
    assert.expect(3);
    server.get('http://localhost:8080/v4/coverage/info', () => [
      200,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify({
        coverage: 98,
        projectUrl: 'https://sonar.foo.bar',
        tests: '7/10'
      })
    ]);

    let service = this.owner.lookup('service:coverage');

    assert.ok(service);

    const config = {
      buildId: 123,
      jobId: 1,
      startTime: '2018-05-10T19:05:53.123Z',
      endTime: '2018-05-10T19:06:53.123Z',
      pipelineId: 456,
      prNum: 5,
      jobName: 'main',
      pipelineName: 'd2lam/mytest',
      scope: 'job'
    };

    const p = service.getCoverageInfo(config);

    p.then(data => {
      const [request] = server.handledRequests;

      assert.deepEqual(data, {
        coverage: '98%',
        coverageUrl: 'https://sonar.foo.bar',
        tests: '7/10',
        testsUrl: 'https://sonar.foo.bar'
      });
      assert.deepEqual(
        request.url,
        // eslint-disable-next-line max-len
        'http://localhost:8080/v4/coverage/info?buildId=123&jobId=1&startTime=2018-05-10T19%3A05%3A53.123Z&endTime=2018-05-10T19%3A06%3A53.123Z&pipelineId=456&prNum=5&jobName=main&pipelineName=d2lam%2Fmytest&scope=job'
      );
    });
  });

  test('it sets default coverage info when request failed', function(assert) {
    assert.expect(3);
    server.get('http://localhost:8080/v4/coverage/info', () => [
      500,
      {
        'Content-Type': 'application/json'
      },
      JSON.stringify({})
    ]);

    let service = this.owner.lookup('service:coverage');

    assert.ok(service);

    const config = {
      buildId: 123,
      jobId: 1,
      startTime: '2018-05-10T19:05:53.123Z',
      endTime: '2018-05-10T19:06:53.123Z'
    };

    const p = service.getCoverageInfo(config);

    p.then(data => {
      const [request] = server.handledRequests;

      assert.deepEqual(data, {
        coverage: 'N/A',
        coverageUrl: '#',
        tests: 'N/A',
        testsUrl: '#'
      });
      assert.deepEqual(
        request.url,
        // eslint-disable-next-line max-len
        'http://localhost:8080/v4/coverage/info?buildId=123&jobId=1&startTime=2018-05-10T19%3A05%3A53.123Z&endTime=2018-05-10T19%3A06%3A53.123Z'
      );
    });
  });
});
