import { moduleFor } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';

moduleFor('route:application', 'Unit | Route | application', {
  // Specify the other units that are required for this test.
  needs: ['service:session']
});

test('it exists', function (assert) {
  let route = this.subject();

  assert.ok(route);
});

test('it calculates title', function (assert) {
  let route = this.subject();

  assert.equal(route.title(), 'screwdriver.cd');
  assert.equal(route.title([]), 'screwdriver.cd');
  assert.equal(route.title(['a', 'b', 'c']), 'a > b > c > screwdriver.cd');
});

test('it should do transitionTo on sessionAuthenticated when valid fromUrl', function (assert) {
  const route = this.subject();
  const transitionStub = this.stub(route, 'transitionTo');
  const contollerForStub = this.stub(route, 'controllerFor');

  contollerForStub.withArgs('application').returns({
    get: (arg) => {
      assert.equal(arg, 'fromUrl');

      return 'fromUrl';
    }
  });

  route.sessionAuthenticated();

  assert.ok(transitionStub.calledOnce, 'transitionTo was not called');
  assert.ok(transitionStub.calledWithExactly('fromUrl'), 'invalid data');
});
