import { setupTest } from 'ember-qunit';
import { module } from 'qunit';
import { later } from '@ember/runloop';
import sinon from 'sinon';
import test from 'ember-sinon-qunit/test-support/test';
import injectScmServiceStub from '../../helpers/inject-scm';

module('Unit | Route | application', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const route = this.owner.lookup('route:application');

    assert.ok(route);
  });

  test('it calculates title', function(assert) {
    const route = this.owner.lookup('route:application');

    assert.equal(route.title(), 'screwdriver.cd');
    assert.equal(route.title([]), 'screwdriver.cd');
    assert.equal(route.title(['a', 'b', 'c']), 'a > b > c > screwdriver.cd');
  });

  test('it should reload on sessionInvalidated', function(assert) {
    const route = this.owner.lookup('route:application');
    const reloadStub = this.stub(route, 'reloadPage');

    route.sessionInvalidated();
    assert.ok(reloadStub.calledOnce, 'reloadPage was not called');
  });

  test('it should clear store and reload page on session change', function(assert) {
    const route = this.owner.lookup('route:application');
    const session = this.owner.lookup('service:session');
    const reloadStub = sinon.stub(route, 'reloadPage');

    session.set('data.sessionChanged', true);

    later(() => {
      assert.ok(reloadStub.calledOnce, 'reloadPage was not called');
    });
  });

  test('it should not clear store and reload page if no session change', function(assert) {
    const route = this.owner.lookup('route:application');
    const session = this.owner.lookup('service:session');
    const reloadStub = sinon.stub(route, 'reloadPage');

    session.set('data.sessionChanged', false);

    later(() => {
      assert.notOk(reloadStub.calledOnce, 'reloadPage was called');
    });
  });

  test('it shoud return model of scms', function(assert) {
    injectScmServiceStub(this, false);

    const route = this.owner.lookup('route:application');

    return route.model().then(scms => {
      assert.equal(scms[0].context, 'github:github.com');
      assert.equal(scms[0].displayName, 'github.com');
      assert.equal(scms[0].iconType, 'github');
      assert.equal(scms[0].isSignedIn, true);
    });
  });
});
