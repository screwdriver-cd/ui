import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Route | templates/pipeline/namespace', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:templates/pipeline/namespace');

    assert.ok(route);
  });

  test('it renders pipeline template data', function (assert) {
    let route = this.owner.lookup('route:templates/pipeline/namespace');

    const oldModelFor = route.modelFor;

    route.modelFor = () => {
      return resolve([
        { id: 1, name: 'foo/x', version: '1.0.0' },
        { id: 2, name: 'foo/y', version: '2.0.0' },
        { id: 2, name: 'foo/z', version: '3.0.0' }
      ]);
    };

    return route.model().then(templates => {
      assert.equal(templates.length, 3);

      route.modelFor = oldModelFor;
    });
  });
});
