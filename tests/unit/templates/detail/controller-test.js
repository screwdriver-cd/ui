import { resolve } from 'rsvp';
import { A } from '@ember/array';
import { moduleFor, test } from 'ember-qunit';
import Service from '@ember/service';

const templateServiceStub = Service.extend({
  deleteTemplates() {
    return resolve([204]);
  }
});

moduleFor('controller:templates/detail', 'Unit | Controller | templates/detail', {
  // Specify the other units that are required for this test.
  // needs: ['controller:foo']
  beforeEach: function beforeEach() {
    this.register('service:template', templateServiceStub);
  }
});

test('it parses model properly', function (assert) {
  let controller = this.subject();

  controller.set('model', [
    { id: 3, version: '3.0.0' },
    { id: 2, version: '2.0.0' },
    { id: 1, version: '1.0.0' }
  ]);

  assert.ok(controller);

  assert.equal(controller.get('selectedVersion'), null);
  assert.equal(controller.get('latest.id'), 3);
  assert.equal(controller.get('template.id'), 3);
});

test('it handles version changes', function (assert) {
  let controller = this.subject();

  controller.set('model', [
    { id: 3, version: '3.0.0' },
    { id: 2, version: '2.0.0' },
    { id: 1, version: '1.0.0' }
  ]);

  assert.ok(controller);
  assert.equal(controller.get('selectedVersion'), null);
  assert.equal(controller.get('latest.id'), 3);
  assert.equal(controller.get('template.id'), 3);
  controller.send('changeVersion', '1.0.0');
  assert.equal(controller.get('selectedVersion'), '1.0.0');
  assert.equal(controller.get('template.id'), 1);
  assert.equal(controller.get('latest.id'), 3);
});

test('it handles model changes', function (assert) {
  let controller = this.subject();
  // eslint-disable-next-line new-cap
  const arr = A([
    { id: 3, version: '3.0.0' },
    { id: 2, version: '2.0.0' },
    { id: 1, version: '1.0.0' }
  ]);

  controller.set('model', arr);

  assert.ok(controller);
  assert.equal(controller.get('selectedVersion'), null);
  assert.equal(controller.get('template.id'), 3);
  assert.equal(controller.get('latest.id'), 3);

  controller.send('changeVersion', '1.0.0');
  assert.equal(controller.get('selectedVersion'), '1.0.0');
  assert.equal(controller.get('template.id'), 1);

  arr.unshiftObject({ id: 4, version: '4.0.0' });
  assert.equal(controller.get('selectedVersion'), null);
  assert.equal(controller.get('template.id'), 4);
  assert.equal(controller.get('latest.id'), 4);
});

test('it handles template deletion', function (assert) {
  let controller = this.subject();
  // eslint-disable-next-line new-cap
  const arr = A([
    { id: 3, name: 'sample', version: '3.0.0' },
    { id: 2, name: 'sample', version: '2.0.0' },
    { id: 1, name: 'sample', version: '1.0.0' }
  ]);

  controller.set('model', arr);

  assert.ok(controller);

  controller.transitionToRoute = (route) => {
    assert.equal(route, 'templates');
  };

  controller.send('removeTemplate', 'sample');
});
