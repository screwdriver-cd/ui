import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

const templateServiceStub = Ember.Service.extend({
  getOneTemplate(name) {
    return Ember.RSVP.resolve([
      { id: 3, name, version: '3.0.0' },
      { id: 2, name, version: '2.0.0' },
      { id: 1, name, version: '1.0.0' }
    ]);
  }
});

moduleFor('route:templates/detail', 'Unit | Route | templates/detail', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  beforeEach: function beforeEach() {
    this.register('service:template', templateServiceStub);
  }
});

test('it asks for the list of templates for a given name', function (assert) {
  let route = this.subject();

  assert.ok(route);

  return route.model({ name: 'foo/bar' }).then((templates) => {
    assert.equal(templates[0].name, 'foo/bar');
  });
});
