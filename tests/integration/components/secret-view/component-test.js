import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn, triggerKeyEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | secret view', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const testSecret = EmberObject.create({
      name: 'TEST_SECRET',
      pipelineId: 123245,
      value: 'banana',
      allowInPR: false
    });

    this.set('mockSecret', testSecret);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set('mockPipeline', testPipeline);

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline}}`);

    assert.dom('.name').hasText('TEST_SECRET');
    assert.dom('.pass input').hasAttribute('placeholder', 'Protected');
    assert.dom('.pass input').hasNoValue();
    assert.dom('.allow input').isNotChecked();
    assert.dom('button').hasText('Delete');

    // button value changes when user types a new value
    await fillIn('.pass input', 'banana');
    await triggerKeyEvent('.pass input', 'keyup', 13);

    assert.dom('button').hasText('Update');

    // button value changes when user types a new value
    await fillIn('.pass input', '');
    await triggerKeyEvent('.pass input', 'keyup', 13);
    assert.dom('button').hasText('Delete');

    // button value changes when user click the checkbox
    await click('.allow input');
    assert.dom('button').hasText('Update');

    // button value changes when user click the checkbox again to change it back
    await click('.allow input');
    assert.dom('button').hasText('Delete');
  });

  test('it trys to open dialog to delete a secret', async function(assert) {
    assert.expect(5);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set(
      'mockSecret',
      EmberObject.extend().create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: null,
        allowInPR: false
      })
    );
    this.set('mockPipeline', testPipeline);

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline}}`);
    // open dialog
    await click('button');

    assert.dom('div.modal-dialog').exists({ count: 1 });
    assert.dom('h4').hasText('Are you sure?');
    assert
      .dom('div.modal-body')
      .hasText("You're about to delete a secret TEST_SECRET. There might be existing jobs using this secret.");
    assert.dom('button.btn-default').hasText('Cancel');
    assert.dom('button.btn-danger').hasText('Confirm');
  });

  test('it trys to cancel deleting a secret', async function(assert) {
    assert.expect(1);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set(
      'mockSecret',
      EmberObject.extend().create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: null,
        allowInPR: false
      })
    );
    this.set('mockPipeline', testPipeline);

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline}}`);
    // open dialog
    await click('button');
    // click cancel
    await click('button.btn-default');

    assert.dom('div.modal-dialog').doesNotExist();
  });

  test('it trys to delete a secret', async function(assert) {
    assert.expect(3);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set(
      'mockSecret',
      EmberObject.extend({
        destroyRecord() {
          // destroy called
          assert.ok(true);

          return Promise.resolve(null);
        },
        save() {
          // update called: Fail!
          assert.ok(false);
        }
      }).create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: null,
        allowInPR: false
      })
    );
    this.set('mockPipeline', testPipeline);
    this.set('secrets', {
      store: {
        unloadRecord: secret => {
          assert.equal(secret.name, 'TEST_SECRET');
        }
      },
      reload: () => {
        // reload called
        assert.ok(true);
      }
    });

    await render(hbs`{{secret-view secret=mockSecret secrets=secrets pipeline=mockPipeline}}`);
    // open dialog
    await click('button');
    // click confirm
    await click('button.btn-danger');
  });

  test('it saves changes to a secret', async function(assert) {
    assert.expect(2);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    // Setting up model so `set` works as expected
    this.set(
      'mockSecret',
      EmberObject.extend({
        destroyRecord() {
          // destroy called: Fail!
          assert.ok(false);
        },
        save() {
          // update called
          assert.equal(this.value, 'banana');
          assert.equal(this.allowInPR, true);
        }
      }).create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: null,
        allowInPR: false
      })
    );
    this.set('mockPipeline', testPipeline);

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline}}`);

    await fillIn('.pass input', 'banana');
    await triggerKeyEvent('.pass input', 'keyup', 13);

    await click('.allow input');
    await click('button');
  });

  test('it renders secrets for child pipeline', async function(assert) {
    assert.expect(2);

    const testSecret = EmberObject.create({
      name: 'TEST_SECRET',
      pipelineId: '123245',
      value: 'banana',
      allowInPR: false
    });
    const testPipeline = EmberObject.create({
      id: '123',
      configPipelineId: '123245'
    });

    this.set('mockSecret', testSecret);
    this.set('mockPipeline', testPipeline);

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline}}`);

    assert.dom('.pass input').hasAttribute('placeholder', 'Inherited from parent pipeline');
    assert.dom('button').hasText('Override');
  });

  test('it overrides a secret for a child pipeline', async function(assert) {
    assert.expect(3);

    const testSecret = EmberObject.create({
      name: 'TEST_SECRET',
      pipelineId: '123245',
      value: 'banana',
      allowInPR: false
    });
    const testPipeline = EmberObject.create({
      id: '123',
      configPipelineId: '123245'
    });

    this.set('mockSecret', testSecret);
    this.set('mockPipeline', testPipeline);
    this.set('externalAction', (name, value, id) => {
      assert.equal(name, 'TEST_SECRET');
      assert.equal(value, 'apple');
      assert.equal(id, '123');
    });

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline
      onCreateSecret=(action externalAction)}}`);

    await fillIn('.pass input', 'apple');
    await triggerKeyEvent('.pass input', 'keyup', 13);

    await click('button');
  });
});
