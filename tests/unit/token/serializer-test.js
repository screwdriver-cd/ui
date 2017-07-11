import { moduleForModel, test } from 'ember-qunit';
import Pretender from 'pretender';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';
let server;

moduleForModel('token', 'Unit | Serializer | token', {
  // Specify the other units that are required for this test.
  needs: ['serializer:token'],
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
  server.post('/tokens', function () {
    return [200, {}, JSON.stringify({ token: { id: 1234 } })];
  });

  Ember.run(() => {
    const token = this.store().createRecord('token', {
      name: 'foo',
      description: 'bar'
    });

    token.save().then(() => {
      assert.equal(token.get('id'), 1234);
    });
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      name: 'foo',
      description: 'bar'
    });
  });
});

test('it serializes only dirty fields', function (assert) {
  assert.expect(1);
  server.patch('/tokens/1234', function () {
    return [200, {}, JSON.stringify({ token: { id: 1234 } })];
  });

  Ember.run(() => {
    this.store().push({
      data: {
        id: 1234,
        type: 'token',
        attributes: {
          name: 'foo',
          description: 'bar'
        }
      }
    });

    const token = this.store().peekRecord('token', 1234);

    token.set('description', 'newDescription');
    token.save();
  });

  return wait().then(() => {
    const [request] = server.handledRequests;
    const payload = JSON.parse(request.requestBody);

    assert.deepEqual(payload, {
      description: 'newDescription'
    });
  });
});
