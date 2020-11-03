import { resolve, reject } from 'rsvp';
import Service from '@ember/service';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn, triggerKeyEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectSessionStub from '../../../helpers/inject-session';
/* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }] */

let syncService;

let cacheService;

module('Integration | Component | pipeline options', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      })
    );

    this.set(
      'mockJobs',
      A([
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
      ])
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);

    // Pipeline
    assert.dom('section.pipeline h3').hasText('Pipeline');
    assert.dom('section.pipeline li').exists({ count: 3 });
    assert.dom('section.pipeline h4').hasText('Checkout URL and Source Directory');
    assert.dom('section.pipeline p').hasText('Update your checkout URL and / or source directory.');
    assert.dom('section.pipeline .button-label').hasText('Update');

    // Jobs
    assert.dom('section.jobs h3').hasText('Jobs');
    assert.dom('section.jobs li').exists({ count: 4 });
    assert.dom('section.jobs li:nth-child(2) h4').hasText('A');
    assert.dom('section.jobs li:nth-child(3) h4').hasText('B');
    assert.dom('section.jobs li:nth-child(4) h4').hasText('main');
    assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    // Sync
    assert.dom('section.sync li:first-child h4').hasText('SCM webhooks');
    assert.dom('section.sync li:nth-child(2) h4').hasText('Pull requests');
    assert.dom('section.sync li:last-child h4').hasText('Pipeline');

    // Cache
    assert.dom('section.cache li:first-child h4').hasText('Pipeline');
    assert.dom('section.cache li:nth-child(2) h4').hasText('Job A');
    assert.dom('section.cache li:nth-child(3) h4').hasText('Job B');
    assert.dom('section.cache li:last-child h4').hasText('Job main');

    // Danger Zone
    assert.dom('section.danger h3').hasText('Danger Zone');
    assert.dom('section.danger li').exists({ count: 1 });
    assert.dom('section.danger h4').hasText('Remove this pipeline');
    assert.dom('section.danger p').hasText('Once you remove a pipeline, there is no going back.');
    assert.dom('section.danger a i').hasClass('fa-trash');
  });

  test('it updates a pipeline', async function(assert) {
    const scm = 'git@github.com:foo/bar.git';

    this.set('updatePipeline', ({ scmUrl }) => {
      assert.equal(scmUrl, scm);
    });

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:notMaster',
        id: 'abc1234',
        rootDir: ''
      })
    );

    await render(
      hbs`{{pipeline-options pipeline=mockPipeline errorMessage="" isSaving=false onUpdatePipeline=(action updatePipeline)}}`
    );
    assert.dom('.scm-url').hasValue('git@github.com:foo/bar.git#notMaster');
    assert.dom('.root-dir').doesNotExist();

    await fillIn('.scm-url', scm);
    await triggerKeyEvent('.text-input', 'keyup', 32);

    assert.dom('.scm-url').hasValue(scm);

    await click('button.blue-button');
  });

  test('it updates a pipeline with rootDir', async function(assert) {
    const scm = 'git@github.com:foo/bar.git';
    const root = 'lib';

    assert.expect(6);

    this.set('updatePipeline', ({ scmUrl, rootDir }) => {
      assert.equal(scmUrl, scm);
      assert.equal(rootDir, root);
    });

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:notMaster',
        rootDir: '',
        id: 'abc1234'
      })
    );

    await render(
      hbs`{{pipeline-options pipeline=mockPipeline errorMessage="" isSaving=false onUpdatePipeline=(action updatePipeline)}}`
    );
    assert.dom('.scm-url').hasValue('git@github.com:foo/bar.git#notMaster');
    assert.dom('.root-dir').doesNotExist('');

    await fillIn('.scm-url', scm);
    await click('.checkbox-input');
    await fillIn('.root-dir', root);
    await triggerKeyEvent('.scm-url', 'keyup', 32);

    assert.dom('.scm-url').hasValue(scm);
    assert.dom('.root-dir').hasValue(root);

    await click('button.blue-button');
  });

  test('it opens job toggle modal', async function(assert) {
    assert.expect(9);

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
    const storeStub = Service.extend({
      peekRecord() {
        assert.ok(true, 'peekRecord called');

        return jobModelMock;
      },
      queryRecord() {
        assert.ok(true, 'queryRecord called');

        return resolve(null);
      }
    });

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      })
    );
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

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeStub);

    await render(hbs`{{pipeline-options
      username=username
      pipeline=mockPipeline
      setJobStatus=setJobStatsMock
      jobs=mockJobs
      showToggleModal=showToggleModal
    }}`);

    assert.equal(this.get('showToggleModal'), false);
    assert.dom('.modal').doesNotExist();

    await click('.x-toggle-btn');

    assert.equal(this.get('showToggleModal'), true);
    // Make sure there is only 1 modal
    assert.dom('.modal').exists({ count: 1 });
    assert.dom('.modal-title').hasText('Disable the "main" job?');
    assert.dom('.message input').exists({ count: 1 });
    assert.dom('.toggle-form__cancel').hasText('Cancel');
    assert.dom('.toggle-form__create').hasText('Confirm');
  });

  test('it handles job disabling', async function(assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      state: 'ENABLED',
      stateChanger: 'tkyi',
      stateChangeMessage: 'testing',
      isDisabled: false
    });

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      })
    );

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

    await click('.x-toggle-btn');
    await click('.toggle-form__create');

    assert.dom('section.jobs h4').hasText('main');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');
    assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
    assert.dom('section.jobs li:nth-child(2) p').hasText('Disabled by tkyi: testing');
  });

  test('it handles job enabling', async function(assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      isDisabled: true
    });

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      })
    );
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

    await click('.x-toggle-btn');
    await click('.toggle-form__create');

    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    // return settled().then(() => {

    // });
  });

  test('it handles pipeline remove flow', async function(assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      })
    );

    this.set('removePipelineMock', () => {
      assert.ok(true);
    });

    await render(
      hbs`{{pipeline-options pipeline=mockPipeline onRemovePipeline=removePipelineMock}}`
    );

    assert.dom('section.danger h4').hasText('Remove this pipeline');

    await click('section.danger a');

    assert.dom('section.danger h4').hasText('Are you absolutely sure?');
    assert.dom('section.danger a').exists({ count: 2 });

    await click('section.danger a');

    assert.dom('section.danger h4').hasText('Remove this pipeline');

    await click('section.danger a');

    assert.dom('section.danger h4').hasText('Are you absolutely sure?');

    await click('section.danger a:last-child');

    assert.dom('section.danger p').hasText('Please wait...');
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

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

    await click('section.sync a');
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

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
    await click('section.sync li:nth-child(2) a');
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

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
    await click('section.sync li:nth-child(3) a');
  });

  test('it fails to sync the pipeline', async function(assert) {
    syncService = Service.extend({
      syncRequests() {
        return reject('something conflicting');
      }
    });

    this.owner.register('service:sync', syncService);

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

    await click('section.sync li:nth-child(3) a');

    assert.dom('.alert > span').hasText('something conflicting');
  });

  test('it does not render pipeline and danger for child pipeline', async function(assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        configPipelineId: '123'
      })
    );

    this.set(
      'mockJobs',
      A([
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
      ])
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);

    // Pipeline should not render
    assert.dom('section.pipeline h3').doesNotExist();

    // Jobs should render
    assert.dom('section.jobs h3').hasText('Jobs');
    assert.dom('section.jobs li').exists({ count: 4 });
    assert.dom('section.jobs li:nth-child(2) h4').hasText('A');
    assert.dom('section.jobs li:nth-child(3) h4').hasText('B');
    assert.dom('section.jobs li:nth-child(4) h4').hasText('main');
    // eslint-disable-next-line max-len
    assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    // Sync should render
    assert.dom('section.sync li:first-child h4').hasText('SCM webhooks');
    assert.dom('section.sync li:nth-child(2) h4').hasText('Pull requests');
    assert.dom('section.sync li:last-child h4').hasText('Pipeline');

    // Cache should render
    assert.dom('section.cache li:first-child h4').hasText('Pipeline');
    assert.dom('section.cache li:nth-child(2) h4').hasText('Job A');
    assert.dom('section.cache li:nth-child(3) h4').hasText('Job B');
    assert.dom('section.cache li:last-child h4').hasText('Job main');

    // Danger Zone should not render
    assert.dom('section.danger h3').doesNotExist();
  });

  test('it clears the pipeline cache', async function(assert) {
    cacheService = Service.extend({
      clearCache(config) {
        assert.equal(config.scope, 'pipelines');
        assert.equal(config.cacheId, '1');

        return resolve({});
      }
    });

    this.owner.register('service:cache', cacheService);

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
    await click('section.cache a');
  });

  test('it clears the job cache', async function(assert) {
    cacheService = Service.extend({
      clearCache(config) {
        assert.equal(config.scope, 'jobs');
        assert.equal(config.cacheId, '2345');

        return resolve({});
      }
    });

    this.owner.register('service:cache', cacheService);

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    this.set(
      'mockJobs',
      A([
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
      ])
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);
    await click('section.cache li:nth-child(2) a');
  });

  test('it fails to clear the cache for the pipeline', async function(assert) {
    cacheService = Service.extend({
      clearCache() {
        return reject('something conflicting');
      }
    });

    this.owner.register('service:cache', cacheService);

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    await render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

    await click('section.cache a');

    assert.dom('.alert > span').hasText('something conflicting');
  });
});
