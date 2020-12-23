import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, settled } from '@ember/test-helpers';
import Pretender from 'pretender';
import ENV from 'screwdriver-ui/config/environment';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline-list-coverage-cell', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders with N/A', async function(assert) {
    assert.expect(2);
    await render(hbs`{{pipeline-list-coverage-cell}}`);

    return settled().then(() => {
      assert.dom('.coverage-value').exists({ count: 0 });
      assert.equal(find('.coverage').textContent.trim(), 'N/A');
    });
  });

  test('it renders with actual coverage value', async function(assert) {
    assert.expect(2);

    const server = new Pretender();

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

    await render(hbs`{{pipeline-list-coverage-cell}}`);

    return settled().then(() => {
      assert.dom('.coverage-value').exists({ count: 1 });
      assert.equal(find('.coverage-value').textContent.trim(), '71.4%');
      server.shutdown();
    });
  });
});
