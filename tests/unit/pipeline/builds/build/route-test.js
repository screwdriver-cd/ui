import EmberObject from '@ember/object';
import { moduleFor, test } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

moduleFor('route:pipeline/builds/build', 'Unit | Route | pipeline/builds/build', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
  assert.equal(route.titleToken({
    job: EmberObject.create({ name: 'main' }),
    build: EmberObject.create({ sha: 'abcd1234567890' })
  }), 'main > #abcd12');
});

sinonTest('it redirects if build not found', function (assert) {
  const route = this.subject();
  const stub = this.stub(route, 'transitionTo');
  const jobId = 345;
  const pipelineId = 123;
  const model = {
    pipeline: {
      get: type => (type === 'id' ? pipelineId : null)
    },
    job: {
      get: type => (type === 'id' ? jobId : null)
    }
  };

  route.afterModel(model);

  assert.ok(stub.calledOnce, 'transitionTo was called once');
  assert.ok(stub.calledWithExactly('pipeline', pipelineId), 'transition to pipeline');
});
