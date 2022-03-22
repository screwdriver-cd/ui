import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;

module('Unit | Serializer | token', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  // Replace this with your real tests.
  test('it serializes records', function (assert) {
    let record = run(() =>
      this.owner.lookup('service:store').createRecord('token')
    );

    let serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('it does not post with model name as key', function (assert) {
    assert.expect(2);
    server.post('http://localhost:8080/v4/tokens', function () {
      return [200, {}, JSON.stringify({ id: 1234 })];
    });

    run(() => {
      const token = this.owner.lookup('service:store').createRecord('token', {
        name: 'foo',
        description: 'bar'
      });

      token.save().then(() => {
        assert.equal(token.get('id'), 1234);
      });
    });

    return settled().then(() => {
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
    server.put('http://localhost:8080/v4/tokens/1234', function () {
      return [200, {}, JSON.stringify({ id: 1234 })];
    });

    run(() => {
      this.owner.lookup('service:store').push({
        data: {
          id: 1234,
          type: 'token',
          attributes: {
            name: 'foo',
            description: 'bar'
          }
        }
      });

      const token = this.owner
        .lookup('service:store')
        .peekRecord('token', 1234);

      token.set('description', 'newDescription');
      token.save();
    });

    return settled().then(() => {
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);

      assert.deepEqual(payload, {
        description: 'newDescription'
      });
    });
  });
});
