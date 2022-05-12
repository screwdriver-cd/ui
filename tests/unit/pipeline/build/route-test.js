import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';
import { getActiveStep } from 'screwdriver-ui/utils/build';
import { visit } from '@ember/test-helpers';
import sinon from 'sinon';

module('Unit | Route | pipeline/build', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/build');

    assert.ok(route);
    assert.equal(
      route.titleToken({
        job: EmberObject.create({ name: 'main' }),
        build: EmberObject.create({
          sha: 'abcd1234567890',
          truncatedSha: 'abcd123'
        })
      }),
      'main > #abcd123'
    );
  });

  sinonTest('it redirects if build not found', function (assert) {
    const route = this.owner.lookup('route:pipeline/build');
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

    route.redirect(model);

    assert.ok(stub.calledOnce, 'transitionTo was called once');
    assert.ok(
      stub.calledWithExactly('pipeline', pipelineId),
      'transition to pipeline'
    );
  });

  sinonTest('it redirects if not step route', function (assert) {
    const route = this.owner.lookup('route:pipeline/build');
    const stub = this.stub(route, 'transitionTo');

    const buildId = 345;
    const pipelineId = 123;

    const transition = { targetName: 'pipeline.build.index' };

    const model = {
      pipeline: {
        get: type => (type === 'id' ? pipelineId : null)
      },
      build: {
        get: type => (type === 'id' ? buildId : null),
        steps: []
      },
      job: {
        get: type => (type === 'pipelineId' ? pipelineId : null)
      },
      event: {
        isPaused: true
      }
    };

    route.redirect(model, transition);

    model.build.steps = [
      { startTime: 's', endTime: 'e', name: 'error', code: 1 }
    ];

    route.redirect(model, transition);

    assert.ok(stub.calledOnce, 'transitionTo was called once');
    assert.ok(
      stub.calledWithExactly(
        'pipeline.build.step',
        pipelineId,
        buildId,
        'error'
      ),
      'transition to build step page'
    );
  });

  sinonTest(
    'it redirects will NOT redirect if on artifacts route',
    function (assert) {
      assert.expect(2);
      const route = this.owner.lookup('route:pipeline/build');
      const spy = this.spy(getActiveStep);
      const buildId = 345;
      const pipelineId = 123;
      const model = {
        pipeline: {
          get: type => (type === 'id' ? pipelineId : null)
        },
        build: {
          get: type => (type === 'id' ? buildId : null),
          steps: []
        },
        job: {
          get: type => (type === 'pipelineId' ? pipelineId : null)
        },
        event: {
          isPaused: true
        }
      };

      let transition = { targetName: 'pipeline.build.artifacts.details' };

      route.redirect(model, transition);
      assert.ok(spy.notCalled, 'redirect was not called');

      transition = { targetName: 'pipeline.build.artifacts.index' };

      route.redirect(model, transition);
      assert.ok(spy.notCalled, 'redirect was not called');
    }
  );

  sinonTest(
    'it redirects to /pipeline/:pipeline_id after 3 seconds if build not found',
    async function (assert) {
      const clock = sinon.useFakeTimers();
      const errorRroute = this.owner.lookup('route:404');
      const pipelineindexRoute = this.owner.lookup(
        'route:pipeline/events/show'
      );
      const buildId = 34565845;
      const pipelineId = 9373;

      await visit(`/pipelines/${pipelineId}/builds/${buildId}`);
      clock.tick(100);
      assert.ok(errorRroute);
      clock.tick(3002);
      assert.ok(pipelineindexRoute);
      clock.restore();
    }
  );
});
