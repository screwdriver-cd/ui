import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { run } from '@ember/runloop';

const logService = Service.extend({
  fetchLogs() {
    return resolve({
      lines: [],
      done: true
    });
  },
  resetCache() {},
  getCache() {}
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
    const { $ } = this;

    this.set('stepList', []);
    this.set('buildSteps', []);
    await render(hbs`{{build-step-collection
      stepList=stepList
      buildStatus="SUCCESS"
      buildId=1
      buildSteps=buildSteps
      buildStart=null
    }}`);

    assert.equal(
      $('h3')
        .text()
        .trim(),
      'Steps'
    );
    assert.equal(
      $('.step-list a:nth-of-type(1)')
        .text()
        .trim(),
      'Setup'
    );
    assert.equal(
      $('.step-list a:nth-of-type(2)')
        .text()
        .trim(),
      'Teardown'
    );
    assert.equal($('.setup-spinner').length, 0);

    await render(hbs`{{#build-step-collection
      stepList=stepList
      buildStatus="SUCCESS"
      buildId=1
      buildSteps=buildSteps
      buildStart=null
    }}
      <div class="hello">hello</div>
    {{/build-step-collection}}`);

    assert.equal(
      $('.hello')
        .text()
        .trim(),
      'hello'
    );
  });

  test('it has a list of steps and can preselect and expand a step', async function(assert) {
    const { $ } = this;
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
    await render(hbs`{{build-step-collection
      preselectedStepName=preselectedStepName
      stepList=stepList
      buildStatus="SUCCESS"
      buildId=1
      buildSteps=buildSteps
      buildStart=null
    }}`);

    run.next(this, () => {
      this.set('preselectedStepName', 'user-step2');

      assert.equal(
        $('h3')
          .text()
          .trim(),
        'Steps'
      );
      assert.equal($('.step-list ul.setup li').length, 3, 'setup');
      assert.equal($('.step-list div.user-steps li').length, 4, 'user');
      assert.equal($('.step-list ul.teardown li').length, 2, 'teardown');
      assert.ok(
        $('.step-list div.user-steps li')
          .eq(1)
          .hasClass('active')
      );
    });
  });
});
