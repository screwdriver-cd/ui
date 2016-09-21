import { moduleForModel, test } from 'ember-qunit';
import Pretender from 'pretender';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';
let server;

moduleForModel('secret', 'Unit | Serializer | secret', {
  // Specify the other units that are required for this test.
  needs: ['serializer:secret'],
  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

// Replace this with your real tests.
test('it serializes records', function (assert) {
  let record = this.subject();

  let serializedRecord = record.serialize();

  assert.ok(serializedRecord);
});

test('it does not post with model name as key', function (assert) {
  assert.expect(2);
  server.post('/secrets', function () {
    return [200, {}, JSON.stringify({ secret: { id: 'abcd' } })];
  });

  Ember.run(() => {
    const secret = this.store().createRecord('secret', {
      pipelineId: 'aabb',
      name: 'foo',
      value: 'bar'
    });

    secret.save().then(() => {
      assert.equal(secret.get('id'), 'abcd');
    });
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      pipelineId: 'aabb',
      name: 'foo',
      value: 'bar',
      allowInPR: false
    });
  });
});
