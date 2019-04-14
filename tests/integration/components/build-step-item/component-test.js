import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, find } from '@ember/test-helpers';
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

    assert.equal(find('.name').textContent.trim(), 'monkey');
    assert.ok(find('i.fa').classList.contains('fa-check'), 'success icon');
    assert.equal(find('.duration').textContent.trim(), '1 second');
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

    assert.ok(find('i.fa').classList.contains('fa-times'), 'fail icon');
  });

  test('it renders an O when not run', async function(assert) {
    await render(hbs`{{build-step-item
      selectedStep="banana"
      stepName="monkey"
    }}`);

    assert.ok(find('i.fa').classList.contains('fa-circle-o'), 'empty icon');
  });

  test('it renders an spinner when running', async function(assert) {
    await render(hbs`{{build-step-item
      selectedStep="banana"
      stepName="monkey"
      stepStart='2016-08-26T20:50:51.531Z'
    }}`);

    assert.ok(find('i.fa').classList.contains('fa-spinner'), 'spin icon');
  });
});
