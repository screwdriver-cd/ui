import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';

moduleForComponent('collections-flyout', 'Integration | Component | collections flyout', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(5);
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const $ = this.$;

  this.set('collections', [
    Ember.Object.create({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [1, 2, 3]
    }),
    Ember.Object.create({
      id: 2,
      name: 'collection2',
      description: 'description2',
      pipelineIds: [4, 5, 6]
    }),
    Ember.Object.create({
      id: 3,
      name: 'collection3',
      description: 'description3',
      pipelineIds: [7, 8, 9]
    })
  ]);

  this.render(hbs`{{collections-flyout collections=collections}}`);

  assert.equal($('.header-text').text().trim(), 'Collections');
  assert.equal($('.header-text a i').attr('class'), 'fa fa-plus-circle fa-mdx ember-view');
  assert.equal($($('.collection-wrapper a').get(0)).text().trim(), 'collection1');
  assert.equal($($('.collection-wrapper a').get(1)).text().trim(), 'collection2');
  assert.equal($($('.collection-wrapper a').get(2)).text().trim(), 'collection3');
});

test('it renders with no collections', function (assert) {
  assert.expect(2);
  const $ = this.$;
  const noCollectionsText = 'No collections to display.';

  this.set('collections', []);

  this.render(hbs`{{collections-flyout collections=collections}}`);

  assert.equal($('.no-collections-text').length, 1);
  assert.equal($('.no-collections-text').text().trim(), noCollectionsText);
});

test('it opens collection create modal', function (assert) {
  assert.expect(9);
  const $ = this.$;

  this.set('collections', []);
  this.set('showModal', false);

  this.render(hbs`{{collections-flyout collections=collections showModal=showModal}}`);
  assert.equal(this.get('showModal'), false);
  // Make sure there are no modals
  assert.notOk($('.modal').length);

  $('.new').click();

  return wait().then(() => {
    const modalTitle = 'Create a new Collection';
    const cancelButton = $($('.modal-footer button').get(0));
    const createButton = $($('.modal-footer button').get(1));

    assert.equal(this.get('showModal'), true);
    // Make sure there is only 1 modal
    assert.equal($('.modal').length, 1);
    assert.equal($('.modal-title').text().trim(), modalTitle);
    assert.equal($('.name input').length, 1);
    assert.equal($('.description input').length, 1);
    assert.equal(cancelButton.text().trim(), 'Cancel');
    assert.equal(createButton.text().trim(), 'Create');
  });
});
