import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | pipeline/job-latest-build', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:pipeline/job-latest-build');

    assert.ok(route);
  });

  // sinonTest('it fetches latest build for given job', function (assert) {
  //   const route = this.owner.lookup('route:pipeline/job-latest-build');
  //   const stub = this.stub(route, 'transitionTo');
  //   const jobId = 345;
  //   const pipelineId = 123;
  //   const model = {
  //     pipeline: {
  //       get: type => (type === 'id' ? pipelineId : null)
  //     },
  //     job: {
  //       get: type => (type === 'id' ? jobId : null)
  //     }
  //   };

  //   route.afterModel(model);

  //   assert.ok(stub.calledOnce, 'transitionTo was called once');
  //   assert.ok(stub.calledWithExactly('pipeline', pipelineId), 'transition to pipeline');
  // });
});
