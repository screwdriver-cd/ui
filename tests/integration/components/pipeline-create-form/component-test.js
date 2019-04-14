import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline create form', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    const { $ } = this;
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    await render(hbs`{{pipeline-create-form errorMessage="" isSaving=false}}`);

    assert.equal(
      $('h1')
        .text()
        .trim(),
      'Create Pipeline'
    );
    assert.equal(
      $('.button-label')
        .text()
        .trim(),
      'Create Pipeline'
    );
  });

  test('it handles the entire ui flow', async function(assert) {
    assert.expect(2);
    const scm = 'git@github.com:foo/bar.git';

    this.set('createPipeline', scmUrl => {
      assert.equal(scmUrl, scm);
    });

    // eslint-disable-next-line max-len
    await render(
      hbs`{{pipeline-create-form errorMessage="" isSaving=false onCreatePipeline=(action createPipeline)}}`
    );
    await fillIn('.text-input', scm).keyup();
    assert.dom('i.fa').hasClass('fa-check', 'success icon');
    await click('button.blue-button');
  });
});
