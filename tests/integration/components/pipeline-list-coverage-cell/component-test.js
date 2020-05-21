import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import RSVP from 'rsvp';

module('Integration | Component | pipeline-list-coverage-cell', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(2);
    this.set(
      'result',
      RSVP.resolve({
        envVars: {
          SD_SONAR_AUTH_URL: 'https://api.screwdriver.cd/v4/coverage/token',
          SD_SONAR_HOST: 'https://sonar.screwdriver.cd'
        },
        coverage: '71.4',
        tests: 'N/A',
        projectUrl: 'https://sonar.screwdriver.cd/dashboard?id=job%3A21'
      })
    );

    await render(hbs`{{pipeline-list-coverage-cell result=result}}`);

    assert.dom('.coverage-value').exists({ count: 1 });
    assert.equal(find('.coverage-value').textContent.trim(), '71.4');
  });
});
