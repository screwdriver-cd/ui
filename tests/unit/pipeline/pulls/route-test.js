import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Route | pipeline/pulls', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/pulls');

    assert.ok(route);
  });

  test('beforeModel: does not redirect when from is pipeline.events*', function (assert) {
    const route = this.owner.lookup('route:pipeline/pulls');

    if (window.localStorage) {
      window.localStorage.removeItem('oldUi');
    }
    route.modelFor = () => ({ pipeline: { id: 123 } });

    route.optInRouteMapping = { switchFromV2: false };
    let called = null;

    route.replaceWith = function (...args) {
      called = args;
    };

    route.beforeModel({ from: { name: 'pipeline.events' } });

    assert.strictEqual(called, null);
    assert.deepEqual(route.pipeline, { id: 123 });
    assert.false(route.optInRouteMapping.switchFromV2);
  });

  test('beforeModel: redirects to v2 when from is undefined (new behavior)', function (assert) {
    const route = this.owner.lookup('route:pipeline/pulls');

    if (window.localStorage) {
      window.localStorage.removeItem('oldUi');
    }
    route.modelFor = () => ({ pipeline: { id: 456 } });
    route.optInRouteMapping = { switchFromV2: false };

    let called = null;

    route.replaceWith = function (...args) {
      called = args;
    };

    route.beforeModel({});

    assert.deepEqual(called, ['v2.pipeline.pulls', 456]);
  });

  test('beforeModel: redirects to v2 for non-events routes', function (assert) {
    const route = this.owner.lookup('route:pipeline/pulls');

    if (window.localStorage) {
      window.localStorage.removeItem('oldUi');
    }
    route.modelFor = () => ({ pipeline: { id: 789 } });
    route.optInRouteMapping = { switchFromV2: false };

    let called = null;

    route.replaceWith = function (...args) {
      called = args;
    };

    route.beforeModel({ from: { name: 'some.other.route' } });

    assert.deepEqual(called, ['v2.pipeline.pulls', 789]);
  });
});
