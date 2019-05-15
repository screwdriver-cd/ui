import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const logService = Service.extend({
  fetchLogs() {
    return resolve({
      lines: [],
      done: true
    });
  },
  resetCache() {},
  getCache() {
    return [];
  }
});

const artifactService = Service.extend({
  fetchManifest() {
    return resolve();
  }
});

module('Integration | Component | build step collection', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:build-logs', logService);
    this.owner.register('service:build-artifact', artifactService);
  });

  test('it renders', async function(assert) {
    this.set('stepList', []);
    this.set('buildSteps', []);
    await render(hbs`{{build-step-collection
      stepList=stepList
      buildStatus="SUCCESS"
      buildId=1
      buildSteps=buildSteps
      buildStart=null
    }}`);

    assert.dom('h3').hasText('Steps');
    assert.dom('.step-list a:nth-of-type(1)').hasText('Setup');
    assert.dom('.step-list a:nth-of-type(2)').hasText('Teardown');
    assert.dom('.setup-spinner').doesNotExist();

    await render(hbs`{{#build-step-collection
      stepList=stepList
      buildStatus="SUCCESS"
      buildId=1
      buildSteps=buildSteps
      buildStart=null
    }}
      <div class="hello">hello</div>
    {{/build-step-collection}}`);

    assert.dom('.hello').hasText('hello');
  });

  test('it has a list of steps and can preselect and expand a step', async function(assert) {
    const stepList = [
      'sd-setup-step1',
      'sd-setup-step2',
      'sd-setup-step3',
      'user-step1',
      'user-step2',
      'user-step3',
      'user-step4',
      'sd-teardown-step1',
      'sd-teardown-step2'
    ];

    this.set('stepList', stepList);
    this.set(
      'buildSteps',
      stepList.map(name => ({
        name,
        startTime: new Date(),
        endTime: new Date(),
        code: 0
      }))
    );
    this.set('preselectedStepName', 'user-step2');
    this.set('changeBuildStep', () => {});

    await render(hbs`{{build-step-collection
      preselectedStepName=preselectedStepName
      stepList=stepList
      buildStatus="SUCCESS"
      buildId=1
      buildSteps=buildSteps
      buildStart=null
      changeBuildStep=(action changeBuildStep)
    }}`);

    assert.dom('h3').hasText('Steps');
    assert.dom('.step-list ul.setup li').exists({ count: 3 });
    assert.dom('.step-list div.user-steps li').exists({ count: 4 });
    assert.dom('.step-list ul.teardown li').exists({ count: 2 });
    assert.dom('.step-list div.user-steps li:nth-child(2)').hasClass('active');
  });
});
