import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;

module('Unit | Serializer | job', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it serializes records', function (assert) {
    const record = run(() =>
      this.owner.lookup('service:store').createRecord('job')
    );

    const serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('it serializes only dirty fields', function (assert) {
    assert.expect(1);
    server.put('http://localhost:8080/v4/jobs/abcd', function () {
      return [200, {}, JSON.stringify({ id: 'abcd' })];
    });

    run(() => {
      this.owner.lookup('service:store').push({
        data: {
          id: 'abcd',
          type: 'job',
          attributes: {
            pipelineId: 'aabb',
            name: 'main',
            state: 'ENABLED'
          }
        }
      });

      const job = this.owner.lookup('service:store').peekRecord('job', 'abcd');

      job.set('state', 'DISABLED');
      job.save();
    });

    return settled().then(() => {
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);

      assert.deepEqual(payload, {
        state: 'DISABLED'
      });
    });
  });
});
