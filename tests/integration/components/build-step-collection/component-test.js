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

module('Integration | Component | build step collection', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:build-logs', logService);
    this.owner.register('service:build-artifact', artifactService);
  });

  test('it renders', async function (assert) {
    this.set('stepList', []);
    this.set('buildSteps', []);
    await render(hbs`<BuildStepCollection
      @stepList={{this.stepList}}
      @buildStatus="SUCCESS"
      @buildId=1
      @buildSteps={{this.buildSteps}}
      @buildStart={{null}}
    />`);

    assert.dom('.step-list .nav-tabs li:nth-of-type(1) a').hasText('Steps');
    assert.dom('.step-list .nav-tabs li:nth-of-type(2) a').hasText('Artifacts');

    assert.dom('h3').hasText('Steps');
    assert.dom('.step-list .tab-content a:nth-of-type(1)').hasText('Setup');
    assert.dom('.step-list .tab-content a:nth-of-type(2)').hasText('Teardown');
    assert.dom('.setup-spinner').doesNotExist();

    await render(hbs`<BuildStepCollection
      @stepList={{this.stepList}}
      @buildStatus="SUCCESS"
      @buildId=1
      @buildSteps={{this.buildSteps}}
      @buildStart={{null}}
    >
      <div class="hello">hello</div>
    </BuildStepCollection>`);

    assert.dom('.hello').hasText('hello');
  });

  test('it has a list of steps and can preselect and expand a step', async function (assert) {
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

    await render(hbs`<BuildStepCollection
      @preselectedStepName={{this.preselectedStepName}}
      @stepList={{this.stepList}}
      @buildStatus="SUCCESS"
      @buildId=1
      @buildSteps={{this.buildSteps}}
      @buildStart={{null}}
      @changeBuildStep={{action this.changeBuildStep}}
    />`);

    assert.dom('h3').hasText('Steps');
    assert.dom('.step-list ul.setup li').exists({ count: 3 });
    assert.dom('.step-list div.user-steps li').exists({ count: 4 });
    assert.dom('.step-list ul.teardown li').exists({ count: 2 });
    assert.dom('.step-list div.user-steps li:nth-child(2)').hasClass('active');
  });

  test('it can preselect an artifact', async function (assert) {
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
    this.set('selectedArtifact', 'environment.json');
    this.set('changeBuildStep', () => {});

    await render(hbs`<BuildStepCollection
      @selectedArtifact={{this.selectedArtifact}}
      @buildStatus="SUCCESS"
      @buildId=1
      @buildSteps={{this.buildSteps}}
      @buildStart={{null}}
      @activeTab="artifacts"
      @changeBuildStep={{action this.changeBuildStep}}
    />`);

    const artifactURL = new RegExp(`.*environment.json.*`);

    assert
      .dom('.build-step-collection > div > .partial-view > div > div > iframe')
      .hasAttribute('src', artifactURL);
  });
});
