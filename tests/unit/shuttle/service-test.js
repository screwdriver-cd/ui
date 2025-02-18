import { module, test } from 'qunit';
import Pretender from 'pretender';
import ENV from 'screwdriver-ui/config/environment';
import { setupTest } from 'screwdriver-ui/tests/helpers';

let server;

module('Unit | Service | shuttle', function (hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:foo']
  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('fetchLogs payload', function (assert) {
    assert.expect(2);
    const service = this.owner.lookup('service:shuttle');

    server.get(
      `${ENV.APP.SDAPI_HOSTNAME}/v4/builds/170338/steps/step6/logs`,
      () => [
        200,
        {
          'Content-Type': 'application/json',
          'x-more-data': false
        },
        JSON.stringify([
          { t: 1581116848342, m: '$ sleep 5 && echo ok', n: 0 },
          { t: 1581116853344, m: 'ok', n: 1 },
          { t: 1581116853344, m: '', n: 2 }
        ])
      ]
    );

    service
      .fetchLogs({
        buildId: 170338,
        stepName: 'step6',
        logNumber: 0,
        pageSize: 10,
        sortOrder: 'ascending'
      })
      .then(result => {
        assert.equal(result.payload.length, 3, 'should have 3 logs');
        assert.equal(
          result.jqXHR.getResponseHeader('x-more-data'),
          'false',
          'no more logs, logs completed'
        );
      });
  });

  test('fetchCoverage payload', function (assert) {
    assert.expect(2);
    const service = this.owner.lookup('service:shuttle');

    server.get(`${ENV.APP.SDAPI_HOSTNAME}/v4/coverage/info`, () => [
      200,
      {
        'Content-Type': 'application/json',
        'x-more-data': false
      },
      JSON.stringify({
        envVars: {
          SD_SONAR_AUTH_URL: 'https://api.screwdriver.cd/v4/coverage/token',
          SD_SONAR_HOST: 'https://sonar.screwdriver.cd'
        },
        coverage: '71.4',
        tests: 'N/A',
        projectUrl: 'https://sonar.screwdriver.cd/dashboard?id=job%3A21'
      })
    ]);

    const buildId = 243421;
    const jobId = 21;
    const startTime = '2020-05-06T23:36:46.779Z';
    const endTime = '2020-05-06T23:50:18.590Z';
    const pipelineId = 123456;
    const prNum = null;

    service
      .fetchCoverage(buildId, jobId, startTime, endTime, pipelineId, prNum)
      .then(result => {
        const { coverage, projectUrl } = result;

        assert.equal(coverage, '71.4', 'coverage is 71.4');
        assert.equal(
          projectUrl,
          'https://sonar.screwdriver.cd/dashboard?id=job%3A21',
          'project url is sonar.screwdriver.cd'
        );
      });
  });

  test('getLatestCommitEvent payload', function (assert) {
    assert.expect(2);
    const service = this.owner.lookup('service:shuttle');

    server.get(
      `${ENV.APP.SDAPI_HOSTNAME}/v4/pipelines/123456/latestCommitEvent`,
      () => [
        200,
        {
          'Content-Type': 'application/json',
          'x-more-data': false
        },
        JSON.stringify({
          id: 3,
          sha: 'sha3'
        })
      ]
    );

    const pipelineId = 123456;

    service.getLatestCommitEvent(pipelineId).then(result => {
      const { id, sha } = result;

      assert.equal(id, '3', 'id is 3');
      assert.equal(sha, 'sha3', 'sha is sha3');
    });
  });

  test('it fetches active banners', function (assert) {
    assert.expect(3);
    const service = this.owner.lookup('service:shuttle');
    const globalBanners = [
      { id: 1, isActive: true, message: 'shutdown imminent', scope: 'GLOBAL' }
    ];
    const pipelineBanners = [
      { id: 11, isActive: true, message: 'hello', scope: 'PIPELINE' }
    ];

    server.get(`${ENV.APP.SDAPI_HOSTNAME}/v4/banners`, request => {
      const { isActive, scope, scopeId } = request.queryParams;

      let result = [];

      if (isActive) {
        if (scope === 'GLOBAL') {
          result = globalBanners;
        } else if (scope === 'PIPELINE' && scopeId === '37') {
          result = pipelineBanners;
        }
      }

      return [
        200,
        {
          'Content-Type': 'application/json'
        },
        JSON.stringify(result)
      ];
    });

    service.fetchBanners('GLOBAL').then(result => {
      assert.deepEqual(result, globalBanners);
    });

    service.fetchBanners('PIPELINE', 37).then(result => {
      assert.deepEqual(result, pipelineBanners);
    });

    service.fetchBanners('PIPELINE', 38).then(result => {
      assert.deepEqual(result, []);
    });
  });
});
