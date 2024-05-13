import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click, fillIn, triggerKeyEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import injectScmServiceStub from '../../../helpers/inject-scm';

module('Integration | Component | pipeline create form', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(
      hbs`<PipelineCreateForm @errorMessage="" @isSaving={{false}} />`
    );

    assert.dom('h1').hasText('Create Pipeline');
    assert.dom('.button-label').hasText('Create Pipeline');
  });

  test('it handles the entire ui flow', async function (assert) {
    assert.expect(3);

    injectScmServiceStub(this);

    const sessionStub = Service.extend({
      get() {
        return 'github:github.com';
      }
    });

    this.owner.register('service:session', sessionStub);

    const scm = 'git@github.com:foo/bar.git';
    const root = 'lib';

    this.set('createPipeline', ({ scmUrl, rootDir }) => {
      assert.equal(scmUrl, scm);
      assert.equal(rootDir, root);
    });

    await render(
      hbs`<PipelineCreateForm
        @errorMessage=""
        @isSaving={{false}}
        @onCreatePipeline={{action this.createPipeline}}
        />`
    );

    await fillIn('.scm-url', scm);
    await click('label.toggle-use-root-dir');
    await fillIn('input.root-dir', root);
    await click('label.toggle-auto-deploy-key-generation');
    await triggerKeyEvent('.scm-url', 'keyup', 32);
    await triggerKeyEvent('.root-dir', 'keyup', 32);

    assert.dom('svg').hasClass('fa-check');

    await click('button.blue-button');
  });

  test('it handles the entire ui flow with branch', async function (assert) {
    assert.expect(3);

    injectScmServiceStub(this);

    const sessionStub = Service.extend({
      get() {
        return 'github:github.com';
      }
    });

    this.owner.register('service:session', sessionStub);

    const scm = 'git@github.com:foo/bar.git#baz';
    const root = 'lib';

    this.set('createPipeline', ({ scmUrl, rootDir }) => {
      assert.equal(scmUrl, scm);
      assert.equal(rootDir, root);
    });

    await render(
      hbs`<PipelineCreateForm
        @errorMessage=""
        @isSaving={{false}}
        @onCreatePipeline={{action this.createPipeline}}
        />`
    );

    await fillIn('.scm-url', scm);
    await click('label.toggle-use-root-dir');
    await fillIn('input.root-dir', root);
    await click('label.toggle-auto-deploy-key-generation');
    await triggerKeyEvent('.scm-url', 'keyup', 32);
    await triggerKeyEvent('.root-dir', 'keyup', 32);

    assert.dom('svg').hasClass('fa-check');

    await click('button.blue-button');
  });

  test('it handles the entire ui flow with special characters branch', async function (assert) {
    assert.expect(3);

    injectScmServiceStub(this);

    const sessionStub = Service.extend({
      get() {
        return 'github:github.com';
      }
    });

    this.owner.register('service:session', sessionStub);

    const scm = 'git@github.com:foo/bar.git#baz!"#$%&\'()-=|@`{;+]},<.>/　🚗';
    const root = 'path/to/!"#$%&\'()-=|@`{;+]},<.>/　🚗';

    this.set('createPipeline', ({ scmUrl, rootDir }) => {
      assert.equal(scmUrl, scm);
      assert.equal(rootDir, root);
    });

    await render(
      hbs`<PipelineCreateForm
        @errorMessage=""
        @isSaving={{false}}
        @onCreatePipeline={{action this.createPipeline}}
        />`
    );

    await fillIn('.scm-url', scm);
    await click('label.toggle-use-root-dir');
    await fillIn('input.root-dir', root);
    await click('label.toggle-auto-deploy-key-generation');
    await triggerKeyEvent('.scm-url', 'keyup', 32);
    await triggerKeyEvent('.root-dir', 'keyup', 32);

    assert.dom('svg').hasClass('fa-check');

    await click('button.blue-button');
  });
});
