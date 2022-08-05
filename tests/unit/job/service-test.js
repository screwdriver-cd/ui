import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import sinon from 'sinon';

let job;

const storeServiceStub = Service.extend({
  peekRecord() {
    return job;
  }
});

module('Unit | Service | job', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.unregister('service:store');
    this.owner.register('service:store', storeServiceStub);
  });

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:job');

    assert.ok(service);
  });

  test('it handles updating job state', function (assert) {
    job = EmberObject.create({
      id: 1234,
      state: 'DISABLED',
      stateChangeMessage: 'foo',
      save: sinon.stub().resolves()
    });

    const service = this.owner.lookup('service:job');
    const p = service.setJobState(1234, 'ENABLED', 'testing');

    p.then(() => {
      assert.equal(job.state, 'ENABLED');
      assert.equal(job.stateChangeMessage, 'testing');
      assert.ok(job.save.calledOnce);
    });
  });

  test('it fails updating job state', function (assert) {
    const error = {
      errors: [{ detail: 'test message' }]
    };

    job = EmberObject.create({
      id: 1234,
      state: 'DISABLED',
      stateChangeMessage: 'foo',
      save: sinon.stub().rejects(error)
    });

    const service = this.owner.lookup('service:job');
    const p = service.setJobState(1234, 'ENABLED', 'testing');

    p.catch(message => {
      assert.equal(job.state, 'DISABLED');
      assert.equal(job.stateChangeMessage, 'foo');
      assert.equal(message, 'test message');
      assert.ok(job.save.calledOnce);
    });
  });
});
