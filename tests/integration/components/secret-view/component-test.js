import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | secret view', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
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
    const passInput = this.$('.pass input');
    const allowInput = this.$('.allow input');

    assert.dom('.name').hasText('TEST_SECRET');
    assert.equal(passInput.attr('placeholder'), 'Protected');
    assert.equal(passInput.val(), '');
    assert.equal(allowInput.prop('checked'), false);
    assert.dom('button').hasText('Delete');

    // button value changes when user types a new value
    passInput.val('banana').keyup();
    assert.dom('button').hasText('Update');

    // button value changes when user types a new value
    passInput.val('').keyup();
    assert.dom('button').hasText('Delete');

    // button value changes when user click the checkbox
    allowInput.click();
    assert.dom('button').hasText('Update');

    // button value changes when user click the checkbox again to change it back
    allowInput.click();
    assert.dom('button').hasText('Delete');
  });

  test('it trys to delete a secret', async function(assert) {
    assert.expect(3);
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

    const testPipeline = EmberObject.create({
      id: '123245'
    });

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
    await click('button');
  });

  test('it saves changes to a secret', async function(assert) {
    assert.expect(2);
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
          assert.equal(this.get('value'), 'banana');
          assert.equal(this.get('allowInPR'), true);
        }
      }).create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: null,
        allowInPR: false
      })
    );

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set('mockPipeline', testPipeline);

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline}}`);
    await fillIn('.pass input', 'banana').keyup();
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

    this.set('mockSecret', testSecret);

    const testPipeline = EmberObject.create({
      id: '123',
      configPipelineId: '123245'
    });

    this.set('mockPipeline', testPipeline);

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline}}`);
    const passInput = this.$('.pass input');

    assert.equal(passInput.attr('placeholder'), 'Inherited from parent pipeline');
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

    this.set('mockSecret', testSecret);

    const testPipeline = EmberObject.create({
      id: '123',
      configPipelineId: '123245'
    });

    this.set('mockPipeline', testPipeline);

    this.set('externalAction', (name, value, id) => {
      assert.equal(name, 'TEST_SECRET');
      assert.equal(value, 'apple');
      assert.equal(id, '123');
    });

    await render(hbs`{{secret-view secret=mockSecret pipeline=mockPipeline
      onCreateSecret=(action externalAction)}}`);
    await fillIn('.pass input', 'apple').keyup();
    await click('button');
  });
});
