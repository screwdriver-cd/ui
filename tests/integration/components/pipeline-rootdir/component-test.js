import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline-rootdir', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(hbs`{{pipeline-rootdir}}`);

    await render(hbs`{{pipeline-rootdir hasRootDir=false}}`);

    assert.dom('.checkbox-input').exists({ count: 1 });
    assert.dom('.root-dir').doesNotExist();
  });

  test('it renders with rootDir', async function (assert) {
    await render(hbs`{{pipeline-rootdir}}`);

    await render(hbs`{{pipeline-rootdir hasRootDir=true rootDir='lib'}}`);
    assert.dom('.root-dir').hasValue('lib');
  });
});
