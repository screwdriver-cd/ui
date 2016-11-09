import { moduleForModel, test } from 'ember-qunit';
import Pretender from 'pretender';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';
let server;

moduleForModel('pipeline', 'Unit | Serializer | pipeline', {
  // Specify the other units that are required for this test.
  needs: [
    'adapter:application',
    'model:event',
    'model:job',
    'model:secret',
    'serializer:pipeline',
    'service:session'
  ],
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

test('it does not post with model name as key', function (assert) {
  assert.expect(2);
  server.post('http://localhost:8080/v4/pipelines', function () {
    return [200, {}, JSON.stringify({ id: 'abcd' })];
  });

  Ember.run(() => {
    const pipeline = this.store().createRecord('pipeline', {
      checkoutUrl: 'git@example.com:foo/bar.git'
    });

    pipeline.save().then(() => {
      assert.equal(pipeline.get('id'), 'abcd');
    });
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      checkoutUrl: 'git@example.com:foo/bar.git'
    });
  });
});
