import { resolve, reject } from 'rsvp';
import Service from '@ember/service';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import {
  render,
  settled,
  click,
  find,
  findAll,
  fillIn
} from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectSessionStub from '../../../helpers/inject-session';
/* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }] */

let syncService;
let cacheService;

module('Integration | Component | pipeline options', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: 'abc1234'
    }));

    this.set('mockJobs', A([
      EmberObject.create({
        id: '3456',
        name: 'B',
        isDisabled: false
      }),
      EmberObject.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      }),
      EmberObject.create({
        id: '2345',
        name: 'A',
        isDisabled: false
      })
    ]));

    await render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);

    // Pipeline
    assert.dom('section.pipeline h3').hasText('Pipeline');
    assert.dom('section.pipeline li').exists({ count: 1 });
    assert.dom('section.pipeline h4').hasText('Checkout URL');
    assert.dom('section.pipeline p').hasText('Update your checkout URL.');
    assert.dom('section.pipeline .button-label').hasText('Update');

    // Jobs
    assert.dom('section.jobs h3').hasText('Jobs');
    assert.dom('section.jobs li').exists({ count: 4 });
    assert.dom('section.jobs h4').hasText('ABmain');
    // eslint-disable-next-line max-len
    assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    // Sync
    assert.equal(this.$(findAll('section.sync h4')[0]).text().trim(), 'SCM webhooks');
    assert.equal(this.$(findAll('section.sync h4')[1]).text().trim(), 'Pull requests');
    assert.equal(this.$(findAll('section.sync h4')[2]).text().trim(), 'Pipeline');

    // Cache
    assert.equal(this.$(findAll('section.cache h4')[0]).text().trim(), 'Pipeline');
    assert.equal(this.$(findAll('section.cache h4')[1]).text().trim(), 'Job A');
    assert.equal(this.$(findAll('section.cache h4')[2]).text().trim(), 'Job B');
    assert.equal(this.$(findAll('section.cache h4')[3]).text().trim(), 'Job main');

    // Danger Zone
    assert.dom('section.danger h3').hasText('Danger Zone');
    assert.dom('section.danger li').exists({ count: 1 });
    assert.dom('section.danger h4').hasText('Remove this pipeline');
    assert.dom('section.danger p').hasText('Once you remove a pipeline, there is no going back.');
    assert.dom('section.danger a i').hasClass('fa-trash');
  });

  test('it updates a pipeline', async function(assert) {
    const scm = 'git@github.com:foo/bar.git';

    this.set('updatePipeline', (scmUrl) => {
      assert.equal(scmUrl, scm);
    });

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:notMaster',
      id: 'abc1234'
    }));

    // eslint-disable-next-line max-len
    await render(
      hbs`{{pipeline-options pipeline=mockPipeline errorMessage="" isSaving=false onUpdatePipeline=(action updatePipeline)}}`
    );
    assert.dom('.text-input').hasValue('git@github.com:foo/bar.git#notMaster');
    await fillIn('.text-input', scm).keyup();
    assert.dom('.text-input').hasValue(scm);
    await click('button.blue-button');
  });

  test('it opens job toggle modal', async function (assert) {
    assert.expect(8);
    const $ = this.$;

    injectSessionStub(this);

    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      isDisabled: false
    });

    const jobModelMock = {
      save() {
        return resolve(main);
      }
    };
    const storeStub = EmberObject.extend({
      peekRecord() {
        assert.ok(true, 'peekRecord called');

        return jobModelMock;
      }
    });

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: 'abc1234'
    }));
    this.set('showToggleModal', false);
    this.set('mockJobs', A([main]));
    this.set('username', 'tkyi');
    this.set('setJobStatsMock', (id, state, name, message) => {
      assert.equal(id, '1234');
      assert.equal(message, ' ');
      assert.equal(name, 'tkyi');
      assert.equal(state, 'DISABLED');

      main.set('state', state);
      main.set('stateChanger', 'tkyi');
      main.set('stateChangeMessage', ' ');
      main.set('isDisabled', state === 'DISABLED');

      this.set('state', state);
      this.set('showToggleModal', false);
    });

    this.owner.register('service:store', storeStub);
    this.store = this.owner.lookup('service:store');

    await render(hbs`{{pipeline-options
      username=username
      pipeline=mockPipeline
      setJobStatus=setJobStatsMock
      jobs=mockJobs
      showToggleModal=showToggleModal
    }}`);

    assert.equal(this.get('showToggleModal'), false);
    assert.notOk($('.modal').length);

    await await click('.x-toggle-btn');

    const modalTitle = 'Disable the "main" job?';
    const cancelButton = $('.toggle-form__cancel');
    const createButton = $('.toggle-form__create');

    assert.equal(this.get('showToggleModal'), true);
    // Make sure there is only 1 modal
    assert.equal($('.modal').length, 1);
    assert.equal($('.modal-title').text().trim(), modalTitle);
    assert.equal($('.message input').length, 1);
    assert.equal(cancelButton.text().trim(), 'Cancel');
    assert.equal(createButton.text().trim(), 'Confirm');
  });

  test('it handles job disabling', async function (assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      state: 'ENABLED',
      stateChanger: 'tkyi',
      stateChangeMessage: 'testing',
      isDisabled: false
    });

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: 'abc1234'
    }));

    this.set('mockJobs', A([main]));
    this.set('username', 'tkyi');
    this.set('setJobStatsMock', (id, state, name) => {
      assert.equal(id, '1234');
      assert.equal(state, 'DISABLED');
      assert.equal(name, 'tkyi');

      main.set('isDisabled', state === 'DISABLED');
    });

    await render(hbs`{{pipeline-options
      username=username
      pipeline=mockPipeline
      setJobStatus=setJobStatsMock
      jobs=mockJobs
    }}`);

    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    await await click('.x-toggle-btn');
    await await click('.toggle-form__create');

    return settled().then(() => {
      assert.dom('section.jobs h4').hasText('main');
      assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');
      assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.Disabled by tkyi: testing');
    });
  });

  test('it handles job enabling', async function (assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      isDisabled: true
    });

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: 'abc1234'
    }));
    this.set('mockJobs', A([main]));
    this.set('setJobStatsMock', (id, state) => {
      assert.equal(id, '1234');
      assert.equal(state, 'ENABLED');

      main.set('isDisabled', state === 'DISABLED');
    });

    await render(hbs`{{pipeline-options
      pipeline=mockPipeline
      setJobStatus=setJobStatsMock
      jobs=mockJobs
    }}`);

    assert.dom('section.jobs h4').hasText('main');
    assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');

    await await click('.x-toggle-btn');
    await await click('.toggle-form__create');

    return settled().then(() => {
      assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');
    });
  });

  test('it handles pipeline remove flow', async function(assert) {
    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: 'abc1234'
    }));

    this.set('removePipelineMock', () => {
      assert.ok(true);
    });

    await render(hbs`{{pipeline-options pipeline=mockPipeline onRemovePipeline=removePipelineMock}}`);

    assert.equal($('section.danger h4').text().trim(), 'Remove this pipeline');
    $('section.danger a').click();
    assert.equal($('section.danger h4').text().trim(), 'Are you absolutely sure?');
    assert.equal($('section.danger a').length, 2);
    $($('section.danger a').get(0)).click();
    assert.equal($('section.danger h4').text().trim(), 'Remove this pipeline');
    $('section.danger a').click();
    $($('section.danger a').get(1)).click();
    assert.equal($('section.danger p').text().trim(), 'Please wait...');
  });

  test('it syncs the webhooks', async function(assert) {
    syncService = Service.extend({
      syncRequests(pipelineId, syncPath) {
        assert.equal(pipelineId, 1);
        assert.equal(syncPath, 'webhooks');

        return resolve({});
      }
    });

    this.owner.register('service:sync', syncService);

    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: '1'
    }));

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
    $($('section.sync a').get(0)).click();
  });

  test('it syncs the pullrequests', async function(assert) {
    syncService = Service.extend({
      syncRequests(pipelineId, syncPath) {
        assert.equal(pipelineId, 1);
        assert.equal(syncPath, 'pullrequests');

        return resolve({});
      }
    });

    this.owner.register('service:sync', syncService);

    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: '1'
    }));

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
    $($('section.sync a').get(1)).click();
  });

  test('it syncs the pipeline', async function(assert) {
    syncService = Service.extend({
      syncRequests(pipelineId, syncPath) {
        assert.equal(pipelineId, 1);
        assert.equal(syncPath, undefined);

        return resolve({});
      }
    });

    this.owner.register('service:sync', syncService);

    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: '1'
    }));

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
    $($('section.sync a').get(2)).click();
  });

  test('it fails to sync the pipeline', async function(assert) {
    syncService = Service.extend({
      syncRequests() {
        return reject('something conflicting');
      }
    });

    this.owner.register('service:sync', syncService);

    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: '1'
    }));

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

    $($('section.sync a').get(2)).click();

    return settled()
      .then(() => {
        assert.dom('.alert > span').hasText('something conflicting');
      });
  });

  test('it does not render pipeline and danger for child pipeline', async function(assert) {
    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: 'abc1234',
      configPipelineId: '123'
    }));

    this.set('mockJobs', A([
      EmberObject.create({
        id: '3456',
        name: 'B',
        isDisabled: false
      }),
      EmberObject.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      }),
      EmberObject.create({
        id: '2345',
        name: 'A',
        isDisabled: false
      })
    ]));

    await render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);

    // Pipeline should not render
    assert.dom('section.pipeline h3').hasText('');

    // Jobs should render
    assert.dom('section.jobs h3').hasText('Jobs');
    assert.dom('section.jobs li').exists({ count: 4 });
    assert.dom('section.jobs h4').hasText('ABmain');
    // eslint-disable-next-line max-len
    assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    // Sync should render
    assert.equal(this.$(findAll('section.sync h4')[0]).text().trim(), 'SCM webhooks');
    assert.equal(this.$(findAll('section.sync h4')[1]).text().trim(), 'Pull requests');
    assert.equal(this.$(findAll('section.sync h4')[2]).text().trim(), 'Pipeline');

    // Cache should render
    assert.equal(this.$(findAll('section.cache h4')[0]).text().trim(), 'Pipeline');
    assert.equal(this.$(findAll('section.cache h4')[1]).text().trim(), 'Job A');
    assert.equal(this.$(findAll('section.cache h4')[2]).text().trim(), 'Job B');
    assert.equal(this.$(findAll('section.cache h4')[3]).text().trim(), 'Job main');

    // Danger Zone should not render
    assert.dom('section.danger h3').hasText('');
  });

  test('it clears the pipeline cache', async function(assert) {
    cacheService = Service.extend({
      clearCache(config) {
        assert.equal(config.scope, 'pipelines');
        assert.equal(config.id, '1');

        return resolve({});
      }
    });

    this.owner.register('service:cache', cacheService);

    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: '1'
    }));

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
    $($('section.cache a').get(0)).click();
  });

  test('it clears the job cache', async function(assert) {
    cacheService = Service.extend({
      clearCache(config) {
        assert.equal(config.scope, 'jobs');
        assert.equal(config.id, '2345');

        return resolve({});
      }
    });

    this.owner.register('service:cache', cacheService);

    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: '1'
    }));

    this.set('mockJobs', A([
      EmberObject.create({
        id: '3456',
        name: 'B',
        isDisabled: false
      }),
      EmberObject.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      }),
      EmberObject.create({
        id: '2345',
        name: 'A',
        isDisabled: false
      })
    ]));

    await render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);
    $($('section.cache a').get(1)).click();
  });

  test('it fails to clear the cache for the pipeline', async function(assert) {
    cacheService = Service.extend({
      clearCache() {
        return reject('something conflicting');
      }
    });

    this.owner.register('service:cache', cacheService);

    const $ = this.$;

    this.set('mockPipeline', EmberObject.create({
      appId: 'foo/bar',
      scmUri: 'github.com:84604643:master',
      id: '1'
    }));

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

    $($('section.cache a').get(0)).click();

    return settled()
      .then(() => {
        assert.dom('.alert > span').hasText('something conflicting');
      });
  });
});
