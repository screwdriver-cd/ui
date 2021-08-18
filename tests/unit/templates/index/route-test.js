import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

const templateServiceStub = Service.extend({
  getAllTemplates() {
    return resolve([
      { id: 3, name: 'foo/bar', version: '3.0.0' },
      { id: 2, name: 'foo/baz', version: '2.0.0' },
      { id: 1, name: 'bar/baz', version: '1.0.0' }
    ]);
  }
});

module('Unit | Route | templates/index', function (hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:template', templateServiceStub);
  });

  test('it dedupes the templates by name', function (assert) {
    let route = this.owner.lookup('route:templates/index');

    assert.ok(route);

    return route.model().then((templates) => {
      assert.equal(templates.length, 3);
    });
  });
});
