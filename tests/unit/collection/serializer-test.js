import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;

module('Unit | Serializer | collection', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it serializes records', function(assert) {
    let record = run(() => this.owner.lookup('service:store').createRecord('collection'));
    let serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('it does not post with model name as key', function(assert) {
    assert.expect(2);
    server.post('/collections', function() {
      return [200, {}, JSON.stringify({ collection: { id: 123 } })];
    });

    run(() => {
      const collection = this.owner.lookup('service:store').createRecord('collection', {
        name: 'Screwdriver',
        description: 'Collection of screwdriver pipelines'
      });

      collection.save().then(() => {
        assert.equal(collection.get('id'), 123);
      });
    });

    return settled().then(() => {
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);

      assert.deepEqual(payload, {
        name: 'Screwdriver',
        description: 'Collection of screwdriver pipelines'
      });
    });
  });

  test('it serializes only dirty fields', function(assert) {
    assert.expect(1);
    server.patch('/collections/123', function() {
      return [200, {}, JSON.stringify({ collection: { id: 123 } })];
    });

    run(() => {
      this.owner.lookup('service:store').push({
        data: {
          id: 123,
          type: 'collection',
          attributes: {
            name: 'Screwdriver',
            description: 'Collection of screwdriver pipelines'
          }
        }
      });

      const collection = this.owner.lookup('service:store').peekRecord('collection', 123);

      collection.set('description', 'newDescription');
      collection.save();
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
