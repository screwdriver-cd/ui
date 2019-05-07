import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | workflow tooltip', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{workflow-tooltip}}`);

    assert.dom(this.element).hasText('Go to build metrics');

    // Template block usage:
    await render(hbs`
      {{#workflow-tooltip}}
        template block text
      {{/workflow-tooltip}}
    `);

    assert.dom(this.element).includesText('template block text');
  });

  test('it renders build detail and metrics links', async function(assert) {
    const data = {
      job: {
        id: 1,
        buildId: 1234,
        name: 'batmobile'
      }
    };

    this.set('data', data);

    await render(hbs`{{workflow-tooltip tooltipData=data}}`);

    assert.dom('.content a').exists({ count: 2 });
    assert.dom('a:first-child').hasText('Go to build details');
    assert.dom('a:last-child').hasText('Go to build metrics');
  });

  test('it renders remote trigger link', async function(assert) {
    const data = {
      externalTrigger: {
        pipelineId: 1234,
        jobName: 'main'
      }
    };

    this.set('data', data);

    await render(hbs`{{workflow-tooltip tooltipData=data}}`);

    assert.dom('.content a').exists({ count: 1 });
    assert.dom(this.element).hasText('Go to remote pipeline');
  });

  test('it renders restart link', async function(assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile'
      }
    };

    this.set('data', data);
    this.set('confirmStartBuild', () => {});

    await render(hbs`{{
      workflow-tooltip
      tooltipData=data
      displayRestartButton=true
      confirmStartBuild="confirmStartBuild"
    }}`);

    assert.dom('.content a').exists({ count: 3 });
    assert.dom('a:first-child').hasText('Go to build details');
    assert.dom('a:last-child').hasText('Start pipeline from here');
  });

  test('it should update position and hidden status', async function(assert) {
    this.set('show', true);
    this.set('pos', 'left');

    await render(hbs`{{
      workflow-tooltip
      showTooltip=show
      showTooltipPosition=pos
    }}`);

    assert.dom('.workflow-tooltip').hasClass('show-tooltip');
    assert.dom('.workflow-tooltip').hasClass('left');

    this.set('show', false);
    this.set('pos', 'center');

    assert.dom('.workflow-tooltip').hasNoClass('show-tooltip');
    assert.dom('.workflow-tooltip').hasNoClass('left');
  });
});
