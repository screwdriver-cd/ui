import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | token view', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const testToken = EmberObject.create({
      name: 'TEST_TOKEN',
      description: 'hunter2'
    });

    this.set('mockToken', testToken);

    await render(hbs`{{token-view token=mockToken}}`);

    assert.dom('.name input').hasValue('TEST_TOKEN');
    assert.dom('.description input').hasValue('hunter2');
    assert.dom('button:last-child').hasText('Delete');

    // button value changes when user types a new name
    await fillIn('.name input', 'TEST_TOKEN_2');
    await triggerEvent('.name input', 'keyup');
    assert.dom('button:last-child').hasText('Update');

    // button value reverts if the new name is the same as the original
    await fillIn('.name input', 'TEST_TOKEN');
    await triggerEvent('.name input', 'keyup');
    assert.dom('button:last-child').hasText('Delete');

    // button value changes when user types a new description
    await fillIn('.description input', 'hunter3');
    await triggerEvent('.description input', 'keyup');
    assert.dom('button:last-child').hasText('Update');

    // button value reverts if the new description is the same as the original
    await fillIn('.description input', 'hunter2');
    await triggerEvent('.description input', 'keyup');
    assert.dom('button:last-child').hasText('Delete');
  });

  test('it trys to delete a token', async function(assert) {
    assert.expect(2);
    this.set(
      'mockToken',
      EmberObject.create({
        name: 'TEST_TOKEN',
        description: 'hunter2'
      })
    );

    this.set('confirmAction', (action, id) => {
      assert.equal(action, 'delete');
      assert.equal(id, this.get('mockToken.id'));
    });

    await render(hbs`{{token-view token=mockToken confirmAction=(action confirmAction)}}`);
    await click('button:last-child');
  });

  test('it saves changes to a token', async function(assert) {
    let expectIsSaving = true;

    assert.expect(3);
    // Setting up model so `set` works as expected
    this.set(
      'mockToken',
      EmberObject.extend({
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
      })
    );

    this.set('setIsSavingMock', isSaving => {
      assert.equal(expectIsSaving, isSaving);
    });

    await render(hbs`{{token-view token=mockToken setIsSaving=setIsSavingMock}}`);
    await fillIn('.name input', 'TEST_TOKEN_2');
    await triggerEvent('.name input', 'keyup');
    await click('button:last-child');
  });
});
