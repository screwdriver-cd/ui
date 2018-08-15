import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import injectSessionStub from '../../../helpers/inject-session';

const mockCollection = {
  id: 1,
  name: 'Test',
  description: 'Test description',
  get: name => name
};

const collectionModel = {
  save() {
    return new EmberPromise(resolve => resolve(mockCollection));
  },
  destroyRecord() {}
};

moduleForComponent('collections-modal', 'Integration | Component | collections modal', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(5);
  const $ = this.$;

  this.set('showModal', true);

  this.render(hbs`{{collection-modal showModal=showModal}}`);

  assert.equal($('.modal-title').text().trim(), 'Create New Collection');
  assert.equal($('.name .control-label').text().trim(), 'Collection Name');
  assert.equal($('.description .control-label').text().trim(), 'Description');
  assert.equal($('.collection-form__cancel').text().trim(), 'Cancel');
  assert.equal($('.collection-form__create').text().trim(), 'Save');
});

test('it cancels creation of a collection', function (assert) {
  const $ = this.$;

  assert.expect(2);

  this.set('showModal', true);
  this.render(hbs`{{collection-modal showModal=showModal}}`);

  assert.equal($('.modal-dialog').length, 1);
  $('.collection-form__cancel').click();
  assert.equal($('.modal-dialog').length, 0);
});

test('it creates a collection', function (assert) {
  injectSessionStub(this);
  assert.expect(4);

  const $ = this.$;
  const storeStub = EmberObject.extend({
    createRecord(model, data) {
      assert.strictEqual(model, 'collection');
      assert.deepEqual(data, {
        name: 'Test',
        description: 'Test description'
      });

      return collectionModel;
    },
    findAll() {
      return new EmberPromise(resolve => resolve([mockCollection]));
    }
  });

  const stubAddFunction = function () {
    assert.ok(true);
  };

  this.set('showModal', true);
  this.set('name', 'Test');
  this.set('description', 'Test description');
  this.set('addToCollection', stubAddFunction);

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.render(hbs`{{collection-modal showModal=showModal name=name description=description}}`);

  assert.equal($('.modal-dialog').length, 1);
  $('.collection-form__create').click();
  assert.notOk(this.get('showModal'));
});

test('it cancels creation of a collection', function (assert) {
  assert.expect(3);

  injectSessionStub(this);

  const $ = this.$;
  const model = {
    save() {
      return new EmberPromise((resolve, reject) => reject({
        errors: [{
          detail: 'This is an error message'
        }]
      }));
    },
    destroyRecord() {}
  };
  const storeStub = EmberObject.extend({
    createRecord() {
      return model;
    }
  });

  this.set('collections', []);
  this.set('showModal', true);
  this.set('errorMessage', null);
  this.set('name', null);
  this.set('description', null);

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.render(hbs`{{collection-modal
    collections=collections
    showModal=showModal
    name=name
    description=description
    errorMessage=errorMessage
  }}`);

  $('.new').click();

  this.set('name', 'Test');
  this.set('description', 'Test description');

  assert.ok(this.get('showModal'));
  $('.collection-form__create').click();
  // Modal should remain open because of error
  assert.ok(this.get('showModal'));
  assert.strictEqual($('.alert-warning > span').text().trim(),
    'This is an error message');
});
