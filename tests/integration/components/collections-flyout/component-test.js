import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import injectSessionStub from '../../../helpers/inject-session';

const mockCollection = {
  id: 1,
  name: 'Test',
  description: 'Test description',
  get: name => name
};

module('Integration | Component | collections flyout', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(5);
    const $ = this.$;

    injectSessionStub(this);

    this.set('collections', [
      EmberObject.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }),
      EmberObject.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      }),
      EmberObject.create({
        id: 3,
        name: 'collection3',
        description: 'description3',
        pipelineIds: [7, 8, 9]
      })
    ]);

    await render(hbs`{{collections-flyout collections=collections}}`);

    assert.equal($('.header__text').text().trim(), 'Collections');
    assert.equal($('.header__text a i').attr('class'), 'fa fa-plus-circle fa-mdx ember-view');
    assert.equal($($('.collection-wrapper a').get(0)).text().trim(), 'collection1');
    assert.equal($($('.collection-wrapper a').get(1)).text().trim(), 'collection2');
    assert.equal($($('.collection-wrapper a').get(2)).text().trim(), 'collection3');
  });

  test('it renders with no collections', async function(assert) {
    assert.expect(2);
    const $ = this.$;
    const noCollectionsText = 'No collections to display.';

    this.set('collections', []);

    await render(hbs`{{collections-flyout collections=collections}}`);

    assert.equal($('.no-collections-text').length, 1);
    assert.equal($('.no-collections-text').text().trim(), noCollectionsText);
  });

  test('it opens collection create modal', async function(assert) {
    assert.expect(9);
    const $ = this.$;

    injectSessionStub(this);

    this.set('collections', []);
    this.set('showModal', false);

    const setModal = () => { this.set('showModal', true); };

    this.set('setModal', setModal);

    await render(hbs`{{collections-flyout
      collections=collections
      showModal=showModal
      setModal=setModal}}`);
    assert.equal(this.get('showModal'), false);
    // Make sure there are no modals
    assert.notOk($('.modal').length);

    $('.new').click();

    return settled().then(() => {
      const modalTitle = 'Create New Collection';
      const cancelButton = $('.collection-form__cancel');
      const createButton = $('.collection-form__create');

      assert.equal(this.get('showModal'), true);
      // Make sure there is only 1 modal
      assert.equal($('.modal').length, 1);
      assert.equal($('.modal-title').text().trim(), modalTitle);
      assert.equal($('.name input').length, 1);
      assert.equal($('.description textarea').length, 1);
      assert.equal(cancelButton.text().trim(), 'Cancel');
      assert.equal(createButton.text().trim(), 'Save');
    });
  });

  test('it renders an active collection', async function(assert) {
    assert.expect(4);
    const $ = this.$;

    this.set('collections', [EmberObject.create(mockCollection)]);

    this.set('selectedCollectionId', 1);

    await render(hbs`{{collections-flyout collections=collections
      selectedCollectionId=selectedCollectionId}}`);

    assert.equal($('.header__text').text().trim(), 'Collections');
    assert.notOk($('.header__text a i').length);
    assert.equal($($('.collection-wrapper a').get(0)).text().trim(), 'Test');
    assert.equal($('.collection-wrapper.row--active').length, 1);
  });

  test('it fails to create a collection', async function(assert) {
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
    this.set('showModal', false);
    this.set('errorMessage', null);
    this.set('name', null);
    this.set('description', null);

    this.owner.register('service:store', storeStub);
    this.store = this.owner.lookup('service:store');

    await render(hbs`{{collections-flyout
      collections=collections
      showModal=showModal
      name=name
      description=description
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

  test('it deletes a collection', async function(assert) {
    assert.expect(9);

    injectSessionStub(this);

    const $ = this.$;
    const collectionModelMock = {
      destroyRecord() {
        // Dummy assert to make sure this function gets called
        assert.ok(true);

        return new EmberPromise(resolve => resolve());
      }
    };
    const storeStub = EmberObject.extend({
      peekRecord() {
        assert.ok(true, 'peekRecord called');

        return collectionModelMock;
      },
      findAll() {
        return new EmberPromise(resolve => resolve([mockCollection]));
      }
    });

    this.set('collections', [
      EmberObject.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }),
      EmberObject.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      }),
      EmberObject.create({
        id: 3,
        name: 'collection3',
        description: 'description3',
        pipelineIds: [7, 8, 9]
      })
    ]);

    let onDeleteSpy = sinon.spy();

    this.set('showModal', false);
    this.set('name', null);
    this.set('description', null);
    this.set('onDeleteCollection', onDeleteSpy);

    this.owner.register('service:store', storeStub);
    this.store = this.owner.lookup('service:store');

    await render(hbs`{{collections-flyout
      collections=collections
      showModal=showModal
      name=name
      description=description
      onDeleteCollection=onDeleteCollection
    }}`);

    assert.ok($('.header__edit').length);
    // Make sure delete buttons aren't shown
    assert.notOk($('.collection-wrapper__delete').length);
    $('.header__edit').click();
    // Delete buttons should be visible
    assert.strictEqual($('.collection-wrapper__delete').length, 3);
    assert.notOk($('.modal').length);
    $($('.collection-wrapper__delete').get(0)).click();
    assert.strictEqual($('.modal').length, 1);
    assert.equal($('.modal-title').text().trim(), 'Please confirm');
    $('.modal-footer > .btn-primary').click();

    assert.ok(onDeleteSpy.called);
  });
});
