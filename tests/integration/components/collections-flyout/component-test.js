import EmberObject from '@ember/object';
import Service from '@ember/service';
import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import injectSessionStub from '../../../helpers/inject-session';

const mockCollection = {
  id: 1,
  name: 'Test',
  type: 'normal',
  description: 'Test description',
  get: name => name
};

const mockCollections = [
  EmberObject.create({
    id: 1,
    name: 'collection1',
    type: 'default',
    description: 'description1',
    pipelineIds: [1, 2, 3]
  }),
  EmberObject.create({
    id: 2,
    name: 'collection2',
    type: 'normal',
    description: 'description2',
    pipelineIds: [4, 5, 6]
  }),
  EmberObject.create({
    id: 3,
    name: 'collection3',
    type: 'normal',
    description: 'description3',
    pipelineIds: [7, 8, 9]
  })
];

module('Integration | Component | collections flyout', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    assert.expect(6);

    injectSessionStub(this);

    this.set('collections', mockCollections);

    await render(hbs`{{collections-flyout collections=collections}}`);

    assert.dom('.header__text').hasText('Collections');
    assert.dom('.header__create').hasText('create');
    assert.dom('.collection-wrapper a').hasText('collection1');

    const wrapperEls = findAll('.collection-wrapper a');

    assert.dom(wrapperEls[0]).hasText('collection1');
    assert.dom(wrapperEls[1]).hasText('collection2');
    assert.dom(wrapperEls[2]).hasText('collection3');
  });

  test('it renders with no collections', async function (assert) {
    assert.expect(2);

    this.set('collections', []);

    await render(hbs`{{collections-flyout collections=collections}}`);

    assert.dom('.no-collections-text').exists({ count: 1 });
    assert.dom('.no-collections-text').hasText('Please create a collection.');
  });

  test('it opens collection create modal', async function (assert) {
    assert.expect(9);

    injectSessionStub(this);

    this.set('collections', []);
    this.set('showModal', false);
    this.set('setModal', () => {
      this.set('showModal', true);
    });

    await render(hbs`{{collections-flyout
      collections=collections
      showModal=showModal
      setModal=setModal}}`);

    assert.equal(this.showModal, false);

    // Make sure there are no modals
    assert.dom('.modal').doesNotExist();

    await click('.header__create');

    assert.equal(this.showModal, true);

    // Make sure there is only 1 modal
    assert.dom('.modal').exists({ count: 1 });
    assert.dom('.modal-title').hasText('Create New Collection');
    assert.dom('.name input').exists({ count: 1 });
    assert.dom('.description textarea').exists({ count: 1 });
    assert.dom('.collection-form__cancel').hasText('Cancel');
    assert.dom('.collection-form__create').hasText('Create');
  });

  test('it renders an active collection', async function (assert) {
    assert.expect(4);

    this.set('collections', [EmberObject.create(mockCollection)]);
    this.set('selectedCollectionId', 1);

    await render(hbs`{{collections-flyout collections=collections
      selectedCollectionId=selectedCollectionId}}`);

    assert.dom('.header__text').hasText('Collections');
    assert.dom('.header__text a i').doesNotExist();
    assert.dom('.collection-wrapper a').hasText('Test');
    assert.dom('.collection-wrapper.row--active').exists({ count: 1 });
  });

  test('it fails to create a collection', async function (assert) {
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
    this.set('showModal', false);
    this.set('errorMessage', null);
    this.set('name', null);
    this.set('description', null);

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeStub);

    await render(hbs`{{collections-flyout
      collections=collections
      showModal=showModal
      name=name
      description=description
    }}`);

    await click('.header__create');

    assert.ok(this.showModal);

    await fillIn('.name input', 'Test');
    await fillIn('.description textArea', 'Test description');
    await click('.collection-form__create');

    // Modal should remain open because of error
    assert.ok(this.showModal);
    assert.dom('.alert-warning > span').hasText('This is an error message');
  });

  test('it deletes a collection', async function (assert) {
    assert.expect(11);

    injectSessionStub(this);

    const collectionModelMock = {
      destroyRecord() {
        // Dummy assert to make sure this function gets called
        assert.ok(true);

        return new EmberPromise(resolve => resolve());
      },
      transitionTo() {
        assert.ok(true);
      },
      unloadRecord() {
        assert.ok(true);
      }
    };
    const storeStub = Service.extend({
      peekRecord() {
        assert.ok(true, 'peekRecord called');

        return collectionModelMock;
      },
      findAll() {
        return new EmberPromise(resolve => resolve([mockCollection]));
      }
    });

    this.set('collections', mockCollections);

    let onDeleteSpy = sinon.spy();

    this.set('showModal', false);
    this.set('name', null);
    this.set('description', null);
    this.set('onDeleteCollection', onDeleteSpy);

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeStub);

    await render(hbs`{{collections-flyout
      collections=collections
      showModal=showModal
      name=name
      description=description
      onDeleteCollection=onDeleteCollection
    }}`);

    // Make sure delete buttons exist but aren't shown
    assert.dom('.collection-wrapper__delete').exists({ count: 2 });
    assert.equal($('.collection-wrapper__delete').css('display'), 'none');

    // Delete buttons should be visible except for default collection
    assert.dom('.collection-wrapper__delete').exists({ count: 2 });
    assert.dom('.modal').doesNotExist();

    await click('.collection-wrapper__delete');

    assert.dom('.modal').exists({ count: 1 });
    assert.dom('.modal-title').hasText('Confirm deletion');

    await click('.modal-footer > .btn-primary');

    assert.ok(onDeleteSpy.called);
  });
});
