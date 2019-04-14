import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectSessionStub from '../../../helpers/inject-session';

module('Integration | Component | job toggle modal', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(4);
    const { $ } = this;

    this.set('showToggleModal', true);
    this.set('name', 'main');
    this.set('stateChange', 'Disable');
    this.set('updateMessageMock', message => {
      assert.equal(message, 'testing');
    });

    await render(hbs`{{job-toggle-modal
      showToggleModal=showToggleModal
      updateMessage=updateMessageMock
      name=name
      stateChange=stateChange
    }}`);

    assert.equal(
      $('.modal-title')
        .text()
        .trim(),
      'Disable the "main" job?'
    );
    assert.equal(
      $('.message .control-label')
        .text()
        .trim(),
      'Reason'
    );
    assert.equal(
      $('.toggle-form__cancel')
        .text()
        .trim(),
      'Cancel'
    );
    assert.equal(
      $('.toggle-form__create')
        .text()
        .trim(),
      'Confirm'
    );
  });

  test('it cancels job state update', async function(assert) {
    const { $ } = this;

    assert.expect(2);

    this.set('showToggleModal', true);
    this.set('name', 'main');
    this.set('stateChange', 'Disable');
    this.set('updateMessageMock', message => {
      assert.equal(message, 'testing');
    });
    await render(hbs`{{job-toggle-modal
      showToggleModal=showToggleModal
      updateMessage=updateMessageMock
      name=name
      stateChange=stateChange
    }}`);

    assert.equal($('.modal-dialog').length, 1);
    $('.toggle-form__cancel').click();
    assert.equal($('.modal-dialog').length, 0);
  });

  test('it updates a job state', async function(assert) {
    injectSessionStub(this);
    assert.expect(3);

    const { $ } = this;
    const stubUpdateFunction = function(message) {
      assert.equal(message, 'testing');
    };

    this.set('showToggleModal', true);
    this.set('message', 'testing');
    this.set('updateMessageMock', stubUpdateFunction);

    await render(hbs`{{job-toggle-modal
      showToggleModal=showToggleModal
      updateMessage=updateMessageMock
      name=name
      message=message
      stateChange=stateChange
    }}`);

    assert.equal($('.modal-dialog').length, 1);
    $('.toggle-form__create').click();
    assert.notOk(this.get('showToggleModal'));
  });
});
