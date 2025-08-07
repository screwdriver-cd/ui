import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/preferences',
  function (hooks) {
    setupRenderingTest(hooks);

    let settings;

    let mockPipeline;

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      settings = this.owner.lookup('service:settings');

      mockPipeline = {
        id: 'pipeline-1',
        settings: {
          showEventTriggers: true,
          filterSchedulerEvents: false,
          filterEventsForNoBuilds: true
        }
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(mockPipeline);
      sinon.stub(settings, 'getSettings').returns({
        showPRJobs: true
      });
    });

    test('it renders', async function (assert) {
      await render(hbs`<Pipeline::Settings::Preferences />`);

      assert.dom('.section').exists({ count: 2 });
      assert.dom('#settings-error-message').doesNotExist();
    });

    test('it renders when no pipeline settings exist', async function (assert) {
      delete mockPipeline.settings;

      await render(hbs`<Pipeline::Settings::Preferences />`);

      assert.dom('.section').exists({ count: 2 });
      assert.dom('#settings-error-message').doesNotExist();
    });

    test('it renders error message when settings are not loaded', async function (assert) {
      settings.getSettings.restore();
      sinon.stub(settings, 'getSettings').returns(undefined);

      await render(hbs`<Pipeline::Settings::Preferences />`);

      assert.dom('#settings-error-message').exists();
    });
  }
);
