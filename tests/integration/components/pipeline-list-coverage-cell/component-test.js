import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, settled, waitFor } from '@ember/test-helpers';
import Pretender from 'pretender';
import ENV from 'screwdriver-ui/config/environment';
import hbs from 'htmlbars-inline-precompile';
import PipelineCellComponent from 'screwdriver-ui/components/pipeline-list-coverage-cell/component';

let server;

module(
  'Integration | Component | pipeline-list-coverage-cell',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      server = new Pretender();
      // make sure component is in viewport to trigger didEnterView event
      document.getElementById('ember-testing').scrollIntoView();
    });

    hooks.afterEach(function () {
      server.shutdown();
    });

    test('it renders with N/A', async function (assert) {
      assert.expect(2);

      this.owner.unregister('component:pipeline-list-coverage-cell');
      this.owner.register(
        'component:pipeline-list-coverage-cell',
        PipelineCellComponent.extend({
          // eslint-disable-next-line no-empty-function
          async didEnterViewport() {}
        })
      );

      await render(hbs`{{pipeline-list-coverage-cell}}`);
      await settled();

      assert.dom('.coverage-value').exists({ count: 0 });
      assert.equal(find('.coverage').textContent.trim(), 'N/A');
    });

    test('it renders with actual coverage value', async function (assert) {
      assert.expect(2);

      const jobData = {
        jobId: 23,
        buildId: 670131,
        startTime: '2020-12-24T06:30:51.608Z',
        endTime: '2020-12-24T06:33:44.157Z',
        prNum: null,
        jobName: 'beta',
        pipelineName: 'screwdriver-cd/ui',
        prParentJobId: null
      };

      this.set('value', jobData);

      server.get(`${ENV.APP.SDAPI_HOSTNAME}/v4/coverage/info`, () => [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          envVars: {
            SD_SONAR_AUTH_URL: 'https://api.screwdriver.cd/v4/coverage/token',
            SD_SONAR_HOST: 'https://sonar.screwdriver.cd'
          },
          coverage: '71.4',
          tests: 'N/A',
          projectUrl: 'https://sonar.screwdriver.cd/dashboard?id=job%3A21'
        })
      ]);

      await render(hbs`{{pipeline-list-coverage-cell value=value}}`);
      await settled();
      await waitFor('.coverage-value');

      assert.dom('.coverage-value').exists({ count: 1 });
      assert.equal(find('.coverage-value').textContent.trim(), '71.4%');
    });
  }
);
