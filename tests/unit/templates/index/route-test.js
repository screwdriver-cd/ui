import { resolve } from 'rsvp';
import Service from '@ember/service';
import { moduleFor, test } from 'ember-qunit';

const templateServiceStub = Service.extend({
  getAllTemplates() {
    return resolve([
      { id: 3, name: 'foo/bar', version: '3.0.0' },
      { id: 2, name: 'foo/bar', version: '2.0.0' },
      { id: 1, name: 'bar/baz', version: '1.0.0' }
    ]);
  }
});

moduleFor('route:templates/index', 'Unit | Route | templates/index', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  beforeEach: function beforeEach() {
    this.register('service:template', templateServiceStub);
  }
});

test('it dedupes the templates by name', function (assert) {
  let route = this.subject();

  assert.ok(route);

  return route.model().then((templates) => {
    assert.equal(templates.length, 2);
  });
});
