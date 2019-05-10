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
    assert.expect(3);
    const scm = 'git@github.com:foo/bar.git';
    const root = 'lib';

    this.set('createPipeline', ({ scmUrl, rootDir }) => {
      assert.equal(scmUrl, scm);
      assert.equal(rootDir, root);
    });

    await render(
      hbs`{{pipeline-create-form errorMessage="" isSaving=false onCreatePipeline=(action createPipeline)}}`
    );

    await fillIn('.scm-url', scm);
    await click('.checkbox-input');
    await fillIn('.root-dir', root);
    await triggerKeyEvent('.scm-url', 'keyup', 'SPACE');
    await triggerKeyEvent('.root-dir', 'keyup', 'SPACE');

    assert.dom('i.fa').hasClass('fa-check');

    await click('button.blue-button');
  });
});
