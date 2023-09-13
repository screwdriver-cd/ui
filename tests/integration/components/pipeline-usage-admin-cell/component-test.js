import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { triggerEvent, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | pipeline-usage-admin-cell', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const column = { title: 'ADMINS' };
    const record = {
      admins: 'tkyi,sakka2,s-yoshika,sugarnaoming,jithine,DekusDenial,yoshwata',
      branch: 'main',
      id: 8204,
      lastRunDate: '10/25/2022',
      name: 'screwdriver-cd/artifacts-unzip-service',
      url: 'https://github.com/screwdriver-cd/artifacts-unzip-service/tree/main'
    };

    this.set('record', record);
    this.set('column', column);

    await render(
      hbs`<PipelineUsageAdminCell @record={{this.record}} @column={{this.column}}/>`
    );

    assert.ok(
      this.element.textContent.includes('tkyi,sakka2,s-yoshika'),
      'has some admin texts'
    );

    await triggerEvent('div.pipeline-usage-admin-cell', 'mouseenter');

    assert
      .dom('.tooltip-inner')
      .hasText(
        'tkyi,sakka2,s-yoshika,sugarnaoming,jithine,DekusDenial,yoshwata',
        'hasTooltip upon click'
      );
  });
});
