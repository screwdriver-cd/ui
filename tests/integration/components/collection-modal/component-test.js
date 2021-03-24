import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectSessionStub from '../../../helpers/inject-session';

const mockCollection = {
  id: 1,
  name: 'Test',
  description: 'Test description',
  type: 'normal',
  get: name => name
};

const collectionModel = {
  save() {
    return new EmberPromise(resolve => resolve(mockCollection));
  },
  destroyRecord() {}
};

module('Integration | Component | collection modal', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.unregister('service:store');
  });

  test('it renders', async function(assert) {
    assert.expect(6);

    this.set('showModal', true);

    await render(hbs`{{collection-modal showModal=showModal}}`);

    assert.dom('.modal-title').hasText('Create New Collection');
    assert.dom('.name .control-label').hasText('Collection Name *');
    assert.dom('.description .control-label').hasText('Description');
    assert.dom('.collection-form__cancel').hasText('Cancel');
    assert
      .dom('.collection-form__create')
      .hasText('Create')
      .isDisabled('Should disable Create button when Name is empty');
  });

  test('it cancels creation of a collection', async function(assert) {
    assert.expect(2);

    this.set('showModal', true);

    await render(hbs`{{collection-modal showModal=showModal}}`);

    assert.dom('.modal-dialog').exists({ count: 1 });

    await click('.collection-form__cancel');

    assert.dom('.modal-dialog').doesNotExist();
  });

  test('it creates a collection', async function(assert) {
    assert.expect(5);

    injectSessionStub(this);

    const storeStub = Service.extend({
      createRecord(model, data) {
        assert.strictEqual(model, 'collection');
        assert.deepEqual(data, {
          name: 'Test',
          description: 'Test description',
          type: 'normal'
        });

        return collectionModel;
      },
      findAll() {
        return new EmberPromise(resolve => resolve([mockCollection]));
      }
    });

    const stubAddFunction = function() {
      assert.ok(true);
    };

    this.set('showModal', true);
    this.set('addToCollection', stubAddFunction);

    this.owner.register('service:store', storeStub);

    await render(hbs`{{collection-modal showModal=showModal name=name description=description}}`);

    assert.dom('.modal-dialog').exists({ count: 1 });

    await fillIn('.name input', 'Test');
    await fillIn('.description textArea', 'Test description');
    assert
      .dom('.collection-form__create')
      .isEnabled('Should enable Create button when Name is Filled');
    await click('.collection-form__create');

    assert.notOk(this.get('showModal'));
  });

  test('it cancels creation of a collection', async function(assert) {
    assert.expect(3);

    injectSessionStub(this);

    const model = {
      save() {
        return new EmberPromise((resolve, reject) =>
          reject({
            errors: [
              {
                detail: 'This is an error message'
              }
            ]
          })
        );
      },
      destroyRecord() {}
    };
    const storeStub = Service.extend({
      createRecord() {
        return model;
      }
    });

    this.set('collections', []);
    this.set('showModal', true);
    this.set('errorMessage', null);
    this.set('name', null);
    this.set('description', null);

    this.owner.register('service:store', storeStub);

    await render(hbs`{{collection-modal
      collections=collections
      showModal=showModal
      name=name
      description=description
      errorMessage=errorMessage
    }}`);

    this.set('name', 'Test');
    this.set('description', 'Test description');

    assert.ok(this.get('showModal'));

    await click('.collection-form__create');

    // Modal should remain open because of error
    assert.ok(this.get('showModal'));
    assert.dom('.alert-warning > span').hasText('This is an error message');
  });
});
