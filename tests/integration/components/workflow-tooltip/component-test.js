import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | workflow tooltip', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{workflow-tooltip}}`);

    assert.equal(find('*').textContent.trim(), '');

    // Template block usage:
    await render(hbs`
      {{#workflow-tooltip}}
        template block text
      {{/workflow-tooltip}}
    `);

    assert.equal(find('*').textContent.trim(), 'template block text');
  });

  test('it renders build link', async function(assert) {
    const data = {
      job: {
        buildId: 1234,
        name: 'batmobile'
      }
    };

    this.set('data', data);

    await render(hbs`{{workflow-tooltip tooltipData=data}}`);

    assert.equal(findAll('.content a').length, 1);
    assert.equal(find('*').textContent.trim(), 'Go to build details');
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

    assert.equal(findAll('.content a').length, 1);
    assert.equal(find('*').textContent.trim(), 'Go to remote pipeline');
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

    assert.equal(findAll('.content a').length, 2);
    assert.equal(find('a').textContent.trim(), 'Go to build detailsStart pipeline from here');
  });

  test('it should update position and hidden status', async function(assert) {
    this.set('show', true);
    this.set('pos', 'left');

    await render(hbs`{{
      workflow-tooltip
      showTooltip=show
      showTooltipPosition=pos
    }}`);

    assert.ok(find('.workflow-tooltip').classList.contains('show-tooltip'));
    assert.ok(find('.workflow-tooltip').classList.contains('left'));

    this.set('show', false);
    this.set('pos', 'center');

    assert.notOk(find('.workflow-tooltip').classList.contains('show-tooltip'));
    assert.notOk(find('.workflow-tooltip').classList.contains('left'));
  });
});
