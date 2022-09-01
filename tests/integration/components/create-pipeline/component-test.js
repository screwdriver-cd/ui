import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';

const allTemplates = [
  {
    description: 'test description',
    id: 12,
    labels: [],
    maintainer: 'foo@bar.com',
    name: 'test',
    namespace: 'dao',
    pipelineId: 122,
    version: '0.0.2'
  }
];

const userSettingsMock = {
  1018240: {
    showPRJobs: true
  },
  1048190: {
    showPRJobs: false
  },
  displayJobNameLength: 30
};

module('Integration | Component | create-pipeline', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const shuttleStub = Service.extend({
      fetchAllTemplates() {
        return new EmberPromise(resolve => resolve(allTemplates));
      },
      getUserSetting() {
        return userSettingsMock;
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);
  });

  test('it renders', async function (assert) {
    this.set('showCreatePipeline', true);
    await render(
      hbs`{{create-pipeline showCreatePipeline=showCreatePipeline}}`
    );

    assert.dom('.left').exists('create-pipeline has left secetion');
    assert.dom('.back').hasText('Back');
    assert.dom('.center').exists('create-pipeline has center secetion');
    assert.dom('.right').exists('create-pipeline has right secetion');
  });

  test('it renders with template selections with namespace', async function (assert) {
    this.set('showCreatePipeline', true);
    await render(
      hbs`{{create-pipeline showCreatePipeline=showCreatePipeline}}`
    );

    await click('.autogenerate-screwdriver-yaml');
    await click('.ember-basic-dropdown-trigger');
    assert
      .dom('.ember-power-select-group-name')
      .exists('create-pipeline has group secetion');
    assert
      .dom('ul.ember-power-select-options')
      .exists('create-pipeline has item selection');
  });
});
