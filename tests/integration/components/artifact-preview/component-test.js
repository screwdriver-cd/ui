import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | artifact-preview', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`{{artifact-preview}}`);
    assert
      .dom('iframe')
      .includesText(
        'Alternative content for browsers which do not support iframe'
      );
  });

  test('it renders download all button if DOWNLOAD_ARTIFACT_DIR is true', async function (assert) {
    this.set('allowDownloadDir', true);

    await render(hbs`<ArtifactPreview @selectedArtifact="/"/>`);
    assert.dom('button').includesText('Download All');
  });

  test('it renders download button if DOWNLOAD_ARTIFACT_DIR is false', async function (assert) {
    this.set('allowDownloadDir', false);

    await render(hbs`<ArtifactPreview @selectedArtifact="/"/>`);
    assert.dom('button').includesText('Download');
  });
});
