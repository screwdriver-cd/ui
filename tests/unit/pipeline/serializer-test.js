import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;

module('Unit | Serializer | pipeline', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it serializes records', function(assert) {
    let record = run(() => this.owner.lookup('service:store').createRecord('pipeline'));

    let serializedRecord = record.serialize();

    assert.ok(serializedRecord);
  });

  test('it does not post with model name as key', function(assert) {
    assert.expect(2);
    server.post('http://localhost:8080/v4/pipelines', function() {
      return [200, {}, JSON.stringify({ id: 'abcd' })];
    });

    run(() => {
      const pipeline = this.owner.lookup('service:store').createRecord('pipeline', {
        checkoutUrl: 'git@example.com:foo/bar.git'
      });

      pipeline.save().then(() => {
        assert.equal(pipeline.get('id'), 'abcd');
      });
    });

    return settled().then(() => {
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);

      assert.deepEqual(payload, {
        checkoutUrl: 'git@example.com:foo/bar.git'
      });
    });
  });
});
