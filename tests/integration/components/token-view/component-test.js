import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | token view', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const $ = this.$;
    const testToken = EmberObject.create({
      name: 'TEST_TOKEN',
      description: 'hunter2'
    });

    this.set('mockToken', testToken);

    await render(hbs`{{token-view token=mockToken}}`);
    const nameInput = $('.name input');
    const descInput = $('.description input');
    const updateButton = $($('button').get(1));

    assert.equal(nameInput.val(), 'TEST_TOKEN');
    assert.equal(descInput.val(), 'hunter2');
    assert.equal(updateButton.text().trim(), 'Delete');

    // button value changes when user types a new name
    nameInput.val('TEST_TOKEN_2').keyup();
    assert.equal(updateButton.text().trim(), 'Update');

    // button value reverts if the new name is the same as the original
    nameInput.val('TEST_TOKEN').keyup();
    assert.equal(updateButton.text().trim(), 'Delete');

    // button value changes when user types a new description
    descInput.val('hunter3').keyup();
    assert.equal(updateButton.text().trim(), 'Update');

    // button value reverts if the new description is the same as the original
    descInput.val('hunter2').keyup();
    assert.equal(updateButton.text().trim(), 'Delete');
  });

  test('it trys to delete a token', async function(assert) {
    const $ = this.$;

    assert.expect(2);
    this.set('mockToken', EmberObject.create({
      name: 'TEST_TOKEN',
      description: 'hunter2'
    }));

    this.set('confirmAction', (action, id) => {
      assert.equal(action, 'delete');
      assert.equal(id, this.get('mockToken.id'));
    });

    await render(hbs`{{token-view token=mockToken confirmAction=(action confirmAction)}}`);
    $($('button').get(1)).click();
  });

  test('it saves changes to a token', async function(assert) {
    const $ = this.$;
    let expectIsSaving = true;

    assert.expect(3);
    // Setting up model so `set` works as expected
    this.set('mockToken', EmberObject.extend({
      destroyRecord() {
        // destroy called: Fail!
        assert.ok(false);
      },
      save() {
        // update called
        assert.equal(this.get('name'), 'TEST_TOKEN_2');
        expectIsSaving = false;

        return resolve();
      }
    }).create({
      name: 'TEST_TOKEN',
      description: 'hunter2'
    }));

    this.set('setIsSavingMock', (isSaving) => {
      assert.equal(expectIsSaving, isSaving);
    });

    await render(hbs`{{token-view token=mockToken setIsSaving=setIsSavingMock}}`);
    $('.name input').val('TEST_TOKEN_2').keyup();
    $($('button').get(1)).click();
  });
});
