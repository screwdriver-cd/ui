import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn, triggerKeyEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline create form', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{pipeline-create-form errorMessage="" isSaving=false}}`);

    assert.dom('h1').hasText('Create Pipeline');
    assert.dom('.button-label').hasText('Create Pipeline');
  });

  test('it handles the entire ui flow', async function(assert) {
    assert.expect(2);
    const scm = 'git@github.com:foo/bar.git';

    this.set('createPipeline', scmUrl => {
      assert.equal(scmUrl, scm);
    });

    await render(
      hbs`{{pipeline-create-form errorMessage="" isSaving=false onCreatePipeline=(action createPipeline)}}`
    );

    await fillIn('.text-input', scm);
    await triggerKeyEvent('.text-input', 'keyup', 'SPACE');

    assert.dom('i.fa').hasClass('fa-check');

    await click('button.blue-button');
  });
});
