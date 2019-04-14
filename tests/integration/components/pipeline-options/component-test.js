import { resolve, reject } from 'rsvp';
import Service from '@ember/service';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, click, find, findAll, fillIn } from '@ember/test-helpers';
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
    assert.equal(find('section.pipeline h3').textContent.trim(), 'Pipeline');
    assert.equal(findAll('section.pipeline li').length, 1);
    assert.equal(find('section.pipeline h4').textContent.trim(), 'Checkout URL');
    assert.equal(find('section.pipeline p').textContent.trim(), 'Update your checkout URL.');
    assert.equal(find('section.pipeline .button-label').textContent.trim(), 'Update');

    // Jobs
    assert.equal(find('section.jobs h3').textContent.trim(), 'Jobs');
    assert.equal(findAll('section.jobs li').length, 4);
    assert.equal(find('section.jobs h4').textContent.trim(), 'ABmain');
    // eslint-disable-next-line max-len
    assert.equal(find('section.jobs p').textContent.trim(), 'Toggle to disable or enable the job.');
    assert.ok(find('.x-toggle-container').classList.contains('x-toggle-container-checked'));

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
    assert.equal(find('section.danger h3').textContent.trim(), 'Danger Zone');
    assert.equal(findAll('section.danger li').length, 1);
    assert.equal(find('section.danger h4').textContent.trim(), 'Remove this pipeline');
    assert.equal(find('section.danger p').textContent.trim(),
      'Once you remove a pipeline, there is no going back.');
    assert.ok(find('section.danger a i').classList.contains('fa-trash'));
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
    assert.equal(find('.text-input').value, 'git@github.com:foo/bar.git#notMaster');
    await fillIn('.text-input', scm).keyup();
    assert.equal(find('.text-input').value, scm);
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

    assert.ok(find('.x-toggle-container').classList.contains('x-toggle-container-checked'));

    await await click('.x-toggle-btn');
    await await click('.toggle-form__create');

    return settled().then(() => {
      assert.equal(find('section.jobs h4').textContent.trim(), 'main');
      assert.notOk(find('.x-toggle-container').classList.contains('x-toggle-container-checked'));
      assert.equal(find('section.jobs p').textContent.trim(),
        'Toggle to disable or enable the job.Disabled by tkyi: testing');
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

    assert.equal(find('section.jobs h4').textContent.trim(), 'main');
    assert.equal(find('section.jobs p').textContent.trim(), 'Toggle to disable or enable the job.');
    assert.notOk(find('.x-toggle-container').classList.contains('x-toggle-container-checked'));

    await await click('.x-toggle-btn');
    await await click('.toggle-form__create');

    return settled().then(() => {
      assert.ok(find('.x-toggle-container').classList.contains('x-toggle-container-checked'));
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
        assert.equal(find('.alert > span').textContent.trim(), 'something conflicting');
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
    assert.equal(find('section.pipeline h3').textContent.trim(), '');

    // Jobs should render
    assert.equal(find('section.jobs h3').textContent.trim(), 'Jobs');
    assert.equal(findAll('section.jobs li').length, 4);
    assert.equal(find('section.jobs h4').textContent.trim(), 'ABmain');
    // eslint-disable-next-line max-len
    assert.equal(find('section.jobs p').textContent.trim(), 'Toggle to disable or enable the job.');
    assert.ok(find('.x-toggle-container').classList.contains('x-toggle-container-checked'));

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
    assert.equal(find('section.danger h3').textContent.trim(), '');
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
        assert.equal(find('.alert > span').textContent.trim(), 'something conflicting');
      });
  });
});
