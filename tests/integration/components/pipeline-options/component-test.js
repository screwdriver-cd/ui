import { resolve, reject } from 'rsvp';
import Service from '@ember/service';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import injectSessionStub from '../../../helpers/inject-session';
/* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }] */

let syncService;
let cacheService;

moduleForComponent('pipeline-options', 'Integration | Component | pipeline options', {
  integration: true
});

test('it renders', function (assert) {
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

  this.render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);

  // Pipeline
  assert.equal(this.$('section.pipeline h3').text().trim(), 'Pipeline');
  assert.equal(this.$('section.pipeline li').length, 1);
  assert.equal(this.$('section.pipeline h4').text().trim(), 'Checkout URL');
  assert.equal(this.$('section.pipeline p').text().trim(), 'Update your checkout URL.');
  assert.equal(this.$('section.pipeline .button-label').text().trim(), 'Update');

  // Jobs
  assert.equal(this.$('section.jobs h3').text().trim(), 'Jobs');
  assert.equal(this.$('section.jobs li').length, 4);
  assert.equal(this.$('section.jobs h4').text().trim(), 'ABmain');
  // eslint-disable-next-line max-len
  assert.equal(this.$('section.jobs p').text().trim(), 'Toggle to disable or enable the job.');
  assert.ok(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));

  // Sync
  assert.equal(this.$(this.$('section.sync h4').get(0)).text().trim(), 'SCM webhooks');
  assert.equal(this.$(this.$('section.sync h4').get(1)).text().trim(), 'Pull requests');
  assert.equal(this.$(this.$('section.sync h4').get(2)).text().trim(), 'Pipeline');

  // Cache
  assert.equal(this.$(this.$('section.cache h4').get(0)).text().trim(), 'Pipeline');
  assert.equal(this.$(this.$('section.cache h4').get(1)).text().trim(), 'Job A');
  assert.equal(this.$(this.$('section.cache h4').get(2)).text().trim(), 'Job B');
  assert.equal(this.$(this.$('section.cache h4').get(3)).text().trim(), 'Job main');

  // Danger Zone
  assert.equal(this.$('section.danger h3').text().trim(), 'Danger Zone');
  assert.equal(this.$('section.danger li').length, 1);
  assert.equal(this.$('section.danger h4').text().trim(), 'Remove this pipeline');
  assert.equal(this.$('section.danger p').text().trim(),
    'Once you remove a pipeline, there is no going back.');
  assert.ok(this.$('section.danger a i').hasClass('fa-trash'));
});

test('it updates a pipeline', function (assert) {
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
  this.render(hbs`{{pipeline-options pipeline=mockPipeline errorMessage="" isSaving=false onUpdatePipeline=(action updatePipeline)}}`);
  assert.equal(this.$('.text-input').val(), 'git@github.com:foo/bar.git#notMaster');
  this.$('.text-input').val(scm).keyup();
  assert.equal(this.$('.text-input').val(), scm);
  this.$('button.blue-button').click();
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

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.render(hbs`{{pipeline-options
    username=username
    pipeline=mockPipeline
    setJobStatus=setJobStatsMock
    jobs=mockJobs
    showToggleModal=showToggleModal
  }}`);

  assert.equal(this.get('showToggleModal'), false);
  assert.notOk($('.modal').length);

  await this.$('.x-toggle-btn').click();

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

  this.render(hbs`{{pipeline-options
    username=username
    pipeline=mockPipeline
    setJobStatus=setJobStatsMock
    jobs=mockJobs
  }}`);

  assert.ok(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));

  await this.$('.x-toggle-btn').click();
  await this.$('.toggle-form__create').click();

  return wait().then(() => {
    assert.equal(this.$('section.jobs h4').text().trim(), 'main');
    assert.notOk(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));
    assert.equal(this.$('section.jobs p').text().trim(),
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

  this.render(hbs`{{pipeline-options
    pipeline=mockPipeline
    setJobStatus=setJobStatsMock
    jobs=mockJobs
  }}`);

  assert.equal(this.$('section.jobs h4').text().trim(), 'main');
  assert.equal(this.$('section.jobs p').text().trim(), 'Toggle to disable or enable the job.');
  assert.notOk(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));

  await this.$('.x-toggle-btn').click();
  await this.$('.toggle-form__create').click();

  return wait().then(() => {
    assert.ok(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));
  });
});

test('it handles pipeline remove flow', function (assert) {
  const $ = this.$;

  this.set('mockPipeline', EmberObject.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: 'abc1234'
  }));

  this.set('removePipelineMock', () => {
    assert.ok(true);
  });

  this.render(hbs`{{pipeline-options pipeline=mockPipeline onRemovePipeline=removePipelineMock}}`);

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

test('it syncs the webhooks', function (assert) {
  syncService = Service.extend({
    syncRequests(pipelineId, syncPath) {
      assert.equal(pipelineId, 1);
      assert.equal(syncPath, 'webhooks');

      return resolve({});
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', EmberObject.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
  $($('section.sync a').get(0)).click();
});

test('it syncs the pullrequests', function (assert) {
  syncService = Service.extend({
    syncRequests(pipelineId, syncPath) {
      assert.equal(pipelineId, 1);
      assert.equal(syncPath, 'pullrequests');

      return resolve({});
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', EmberObject.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
  $($('section.sync a').get(1)).click();
});

test('it syncs the pipeline', function (assert) {
  syncService = Service.extend({
    syncRequests(pipelineId, syncPath) {
      assert.equal(pipelineId, 1);
      assert.equal(syncPath, undefined);

      return resolve({});
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', EmberObject.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
  $($('section.sync a').get(2)).click();
});

test('it fails to sync the pipeline', function (assert) {
  syncService = Service.extend({
    syncRequests() {
      return reject('something conflicting');
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', EmberObject.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

  $($('section.sync a').get(2)).click();

  return wait()
    .then(() => {
      assert.equal(this.$('.alert > span').text().trim(), 'something conflicting');
    });
});

test('it does not render pipeline and danger for child pipeline', function (assert) {
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

  this.render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);

  // Pipeline should not render
  assert.equal(this.$('section.pipeline h3').text().trim(), '');

  // Jobs should render
  assert.equal(this.$('section.jobs h3').text().trim(), 'Jobs');
  assert.equal(this.$('section.jobs li').length, 4);
  assert.equal(this.$('section.jobs h4').text().trim(), 'ABmain');
  // eslint-disable-next-line max-len
  assert.equal(this.$('section.jobs p').text().trim(), 'Toggle to disable or enable the job.');
  assert.ok(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));

  // Sync should render
  assert.equal(this.$(this.$('section.sync h4').get(0)).text().trim(), 'SCM webhooks');
  assert.equal(this.$(this.$('section.sync h4').get(1)).text().trim(), 'Pull requests');
  assert.equal(this.$(this.$('section.sync h4').get(2)).text().trim(), 'Pipeline');

  // Cache should render
  assert.equal(this.$(this.$('section.cache h4').get(0)).text().trim(), 'Pipeline');
  assert.equal(this.$(this.$('section.cache h4').get(1)).text().trim(), 'Job A');
  assert.equal(this.$(this.$('section.cache h4').get(2)).text().trim(), 'Job B');
  assert.equal(this.$(this.$('section.cache h4').get(3)).text().trim(), 'Job main');

  // Danger Zone should not render
  assert.equal(this.$('section.danger h3').text().trim(), '');
});

test('it clears the pipeline cache', function (assert) {
  cacheService = Service.extend({
    clearCache(config) {
      assert.equal(config.scope, 'pipelines');
      assert.equal(config.id, '1');

      return resolve({});
    }
  });

  this.register('service:cache', cacheService);

  const $ = this.$;

  this.set('mockPipeline', EmberObject.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
  $($('section.cache a').get(0)).click();
});

test('it clears the job cache', function (assert) {
  cacheService = Service.extend({
    clearCache(config) {
      assert.equal(config.scope, 'jobs');
      assert.equal(config.id, '2345');

      return resolve({});
    }
  });

  this.register('service:cache', cacheService);

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

  this.render(hbs`{{pipeline-options pipeline=mockPipeline jobs=mockJobs}}`);
  $($('section.cache a').get(1)).click();
});

test('it fails to clear the cache for the pipeline', function (assert) {
  cacheService = Service.extend({
    clearCache() {
      return reject('something conflicting');
    }
  });

  this.register('service:cache', cacheService);

  const $ = this.$;

  this.set('mockPipeline', EmberObject.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

  $($('section.cache a').get(0)).click();

  return wait()
    .then(() => {
      assert.equal(this.$('.alert > span').text().trim(), 'something conflicting');
    });
});
