import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | build step item', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders and calls click handler', async function(assert) {
    assert.expect(4);
    this.set('mockClick', name => assert.equal(name, 'monkey'));
    await render(hbs`{{build-step-item
      selectedStep="banana"
      stepName="monkey"
      stepStart='2016-08-26T20:50:51.531Z'
      stepEnd="2016-08-26T20:50:52.531Z"
      stepCode=0
      onClick=(action mockClick)
    }}`);

    assert.dom('.name').hasText('monkey');
    assert.dom('i.fa').hasClass('fa-check', 'success icon');
    assert.dom('.duration').hasText('1 second');
    await click('.name');
  });

  test('it renders an X when failed', async function(assert) {
    await render(hbs`{{build-step-item
      selectedStep="banana"
      stepName="monkey"
      stepStart='2016-08-26T20:50:51.531Z'
      stepEnd="2016-08-26T20:50:52.531Z"
      stepCode=128
    }}`);

    assert.dom('i.fa').hasClass('fa-times', 'fail icon');
  });

  test('it renders an O when not run', async function(assert) {
    await render(hbs`{{build-step-item
      selectedStep="banana"
      stepName="monkey"
    }}`);

    assert.dom('i.fa').hasClass('fa-circle-o', 'empty icon');
  });

  test('it renders an spinner when running', async function(assert) {
    await render(hbs`{{build-step-item
      selectedStep="banana"
      stepName="monkey"
      stepStart='2016-08-26T20:50:51.531Z'
    }}`);

    assert.dom('i.fa').hasClass('fa-spinner', 'spin icon');
  });
});
