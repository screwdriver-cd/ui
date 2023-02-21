import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectSessionStub from '../../../helpers/inject-session';

module('Integration | Component | job toggle modal', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    assert.expect(4);

    this.set('showToggleModal', true);
    this.set('name', 'main');
    this.set('stateChange', 'Disable');
    this.set('updateMessageMock', message => {
      assert.equal(message, 'testing');
    });

    await render(hbs`<JobToggleModal
      @showToggleModal={{this.showToggleModal}}
      @updateMessage={{this.updateMessageMock}}
      @name={{this.name}}
      @stateChange={{this.stateChange}}
    />`);

    assert.dom('.modal-title').hasText('Disable the "main" job?');
    assert.dom('.message.control-label label').hasText('Reason');
    assert.dom('.toggle-form__cancel').hasText('Cancel');
    assert.dom('.toggle-form__create').hasText('Confirm');
  });

  test('it cancels job state update', async function (assert) {
    assert.expect(2);

    this.set('showToggleModal', true);
    this.set('name', 'main');
    this.set('stateChange', 'Disable');
    this.set('updateMessageMock', message => {
      assert.equal(message, 'testing');
    });
    await render(hbs`<JobToggleModal
      @showToggleModal={{this.showToggleModal}}
      @updateMessage={{this.updateMessageMock}}
      @name={{this.name}}
      @stateChange={{this.stateChange}}
    />`);

    assert.dom('.modal-dialog').exists({ count: 1 });

    await click('.toggle-form__cancel');

    assert.dom('.modal-dialog').doesNotExist();
  });

  test('it updates a job state', async function (assert) {
    injectSessionStub(this);
    assert.expect(3);

    const stubUpdateFunction = function (message) {
      assert.equal(message, 'testing');
    };

    this.set('showToggleModal', true);
    this.set('message', 'testing');
    this.set('updateMessageMock', stubUpdateFunction);

    await render(hbs`<JobToggleModal
      @showToggleModal={{this.showToggleModal}}
      @updateMessage={{this.updateMessageMock}}
      @name={{this.name}}
      @message={{this.message}}
      @stateChange={{this.stateChange}}
    />`);

    assert.dom('.modal-dialog').exists({ count: 1 });

    await click('.toggle-form__create');

    assert.notOk(this.showToggleModal);
  });
});
