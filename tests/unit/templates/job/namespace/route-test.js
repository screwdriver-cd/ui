import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import Service from '@ember/service';
import { setupTest } from 'screwdriver-ui/tests/helpers';

const templateServiceStub = Service.extend({
  getAllTemplates() {
    return resolve([
      { id: 3, name: 'foo/bar', version: '3.0.0' },
      { id: 2, name: 'foo/baz', version: '2.0.0' }
    ]);
  }
});

module('Unit | Route | templates/job/namespace', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function beforeEach() {
    this.owner.register('service:template', templateServiceStub);
  });

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:templates/job/namespace');

    assert.ok(route);
  });

  test('it renders job template data', function (assert) {
    let route = this.owner.lookup('route:templates/job/namespace');

    return route.model({ namespace: 'foo' }).then(templates => {
      assert.equal(templates.length, 2);
    });
  });
});
