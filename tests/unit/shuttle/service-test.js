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
});
