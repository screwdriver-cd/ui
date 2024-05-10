import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { later } from '@ember/runloop';
import sinon from 'sinon';
import ENV from 'screwdriver-ui/config/environment';

module('Unit | Route | pipeline/events/show', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/events/show');

    assert.ok(route);
  });

  test('it redirect to itself', function (assert) {
    const route = this.owner.lookup('route:pipeline/events/show');
    const model = { pipeline: {} };
    const transition = {
      from: {
        name: 'pipeline.events.show'
      },
      to: {
        name: 'pipeline.events.show'
      }
    };

    route.redirect(model, transition);
    assert.ok(route.selfRedirect, 'redirect from itself');
  });

  test('it redirect from other route', function (assert) {
    const route = this.owner.lookup('route:pipeline/events/show');
    const model = { pipeline: {} };
    const transition = {
      from: {
        name: 'pipeline.build.index'
      },
      to: {
        name: 'pipeline.events.show'
      }
    };

    route.redirect(model, transition);

    assert.notOk(route.selfRedirect, 'redirect from other route');
  });

  test('it calls didTransition', function (assert) {
    const route = this.owner.lookup('route:pipeline/events/show');
    const stub = sinon.stub(route, 'scrollToHighlightedEvent');

    route.didTransition();

    assert.notOk(route.hasScrolled, 'has not scrolled yet');
    assert.notOk(route.selfRedirect, 'redirect from other route');
    later(() => {
      assert.ok(stub.calledOnce, 'scrollToHighlightedEvent was called once');
    }, (ENV.APP.WAITING_TO_SCROLL_TIME + ENV.APP.DEBOUNCED_SCROLL_TIME) * 1000);
  });

  test('it calls didTransition', function (assert) {
    const route = this.owner.lookup('route:pipeline/events/show');
    const stub = sinon.stub(route, 'scrollToHighlightedEvent');

    route.hasScrolled = true;
    route.selfRedirect = true;
    route.didTransition();

    later(() => {
      assert.notOk(stub.called, 'scrollToHighlightedEvent was NOT called');
    }, (ENV.APP.WAITING_TO_SCROLL_TIME + ENV.APP.DEBOUNCED_SCROLL_TIME) * 1000);
  });
});
