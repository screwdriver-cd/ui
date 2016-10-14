import { moduleForModel, test } from 'ember-qunit';
import Pretender from 'pretender';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';
let server;

moduleForModel('job', 'Unit | Serializer | job', {
  // Specify the other units that are required for this test.
  needs: ['serializer:job', 'adapter:application', 'service:session', 'model:build'],
  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

test('it serializes records', function (assert) {
  let record = this.subject();

  let serializedRecord = record.serialize();

  assert.ok(serializedRecord);
});

test('it serializes only dirty fields', function (assert) {
  assert.expect(1);
  server.put('http://localhost:8080/v4/jobs/abcd', function () {
    return [200, {}, JSON.stringify({ id: 'abcd' })];
  });

  Ember.run(() => {
    this.store().push({
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

    const job = this.store().peekRecord('job', 'abcd');

    job.set('state', 'DISABLED');
    job.save();
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      state: 'DISABLED'
    });
  });
});
