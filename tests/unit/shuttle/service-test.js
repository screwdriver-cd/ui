import { module, test } from 'qunit';
import Pretender from 'pretender';
import ENV from 'screwdriver-ui/config/environment';
import { setupTest } from 'ember-qunit';

let server;

module('Unit | Service | shuttle', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:foo']
  hooks.beforeEach(function() {
    server = new Pretender();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('fetchLogs payload', function(assert) {
    assert.expect(2);
    let service = this.owner.lookup('service:shuttle');

    server.get(`${ENV.APP.SDAPI_HOSTNAME}/v4/builds/170338/steps/step6/logs`, () => [
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
    ]);

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

  test('fetchCoverage payload', function(assert) {
    assert.expect(2);
    let service = this.owner.lookup('service:shuttle');

    server.get(
      `${ENV.APP.SDAPI_HOSTNAME}/v4/coverage/info?buildId=243421&jobId=21&startTime=2020-05-06T23%3A36%3A46.779Z&endTime=2020-05-06T23%3A50%3A18.590Z`,
      () => [
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
      ]
    );

    service
      .fetchCoverage({
        buildId: 243421,
        jobId: 21,
        startTime: '2020-05-06T23:36:46.779Z',
        endTime: '2020-05-06T23:50:18.590Z'
      })
      .then(result => {
        assert.equal(result.payload.coverage, '71.4', 'coverage is 71.4');
        assert.equal(
          result.payload.projectUrl,
          'https://sonar.screwdriver.cd/dashboard?id=job%3A21',
          'project url is sonar.screwdriver.cd'
        );
      });
  });
});
