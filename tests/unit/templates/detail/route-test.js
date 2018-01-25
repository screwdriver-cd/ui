import { resolve } from 'rsvp';
import Service from '@ember/service';
import { moduleFor, test } from 'ember-qunit';

const templateServiceStub = Service.extend({
  getOneTemplate(name) {
    return resolve([
      { id: 3, name, version: '3.0.0' },
      { id: 2, name, version: '2.0.0' },
      { id: 1, name, version: '1.0.0' }
    ]);
  },
  getTemplateTags(name) {
    return resolve([
      { id: 5, name, version: '3.0.0', tag: 'latest' },
      { id: 6, name, version: '3.0.0', tag: 'stable' },
      { id: 7, name, version: '2.0.0', tag: 'meeseeks' }
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
