import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;

module('Unit | Serializer | secret', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  // Replace this with your real tests.
  test('it serializes records', function(assert) {
    let record = run(() => this.owner.lookup('service:store').createRecord('secret'));

    let serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('it does not post with model name as key', function(assert) {
    assert.expect(2);
    server.post('/secrets', function() {
      return [200, {}, JSON.stringify({ secret: { id: 'abcd' } })];
    });

    run(() => {
      const secret = this.owner.lookup('service:store').createRecord('secret', {
        pipelineId: 'aabb',
        name: 'foo',
        value: 'bar'
      });

      secret.save().then(() => {
        assert.equal(secret.get('id'), 'abcd');
      });
    });

    return settled().then(() => {
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

  test('it serializes only dirty fields', function(assert) {
    assert.expect(1);
    server.patch('/secrets/abcd', function() {
      return [200, {}, JSON.stringify({ secret: { id: 'abcd' } })];
    });

    run(() => {
      this.owner.lookup('service:store').push({
        data: {
          id: 'abcd',
          type: 'secret',
          attributes: {
            pipelineId: 'aabb',
            name: 'foo',
            value: 'bar',
            allowInPR: false
          }
        }
      });

      const secret = this.owner.lookup('service:store').peekRecord('secret', 'abcd');

      secret.set('value', 'newValue');
      secret.save();
    });

    return settled().then(() => {
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);

      assert.deepEqual(payload, {
        value: 'newValue'
      });
    });
  });
});
