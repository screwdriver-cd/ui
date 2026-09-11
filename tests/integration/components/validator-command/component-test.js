import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator command', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('commandMock', {
      namespace: 'test-namespace',
      name: 'test-command',
      version: '1.2.3',
      description: 'Test Description',
      maintainer: 'Test maintainer',
      format: 'binary',
      binary: {
        file: './test.sh'
      }
    });

    await render(
      hbs`<ValidatorCommand @name="test-command" @command={{this.commandMock}} />`
    );

    assert.dom('h4').hasText('test-command');
    assert.dom('.command-description').hasText('Description: Test Description');
    assert.dom('.command-maintainer').hasText('Maintainer: Test maintainer');
    assert.dom('.command-version').hasText('Version: 1.2.3');
    assert.dom('.command-format').hasText('format: binary');
    assert.dom('.command-body').hasText('binary: file: ./test.sh');
  });

  test('it handles clicks on header', async function (assert) {
    this.set('commandMock', {
      namespace: 'test-namespace',
      name: 'test-command',
      version: '1.2.3',
      description: 'Test Description',
      maintainer: 'Test maintainer',
      format: 'binary',
      binary: {
        file: './test.sh'
      }
    });

    await render(
      hbs`<ValidatorCommand @name="test-command" @command={{this.commandMock}} />`
    );

    assert.dom('.command-description').isVisible();

    await click('h4');

    assert.dom('.command-description').isNotVisible();

    await click('h4');

    assert.dom('.command-description').isVisible();
  });
});
