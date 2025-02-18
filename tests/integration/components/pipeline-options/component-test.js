import { click, fillIn, render, triggerKeyEvent } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { reject, resolve } from 'rsvp';
import $ from 'jquery';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import Pretender from 'pretender';
import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import injectSessionStub from '../../../helpers/inject-session';

/* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }] */

let syncService;

let cacheService;

let server;

module('Integration | Component | pipeline options', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it renders', async function (assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        admins: {
          admin1: true,
          admin2: true,
          admin3: true,
          admin4: true,
          admin5: true,
          admin6: true
        }
      })
    );

    this.set(
      'mockJobs',
      A([
        EmberObject.create({
          id: '3456',
          name: 'B',
          isDisabled: false,
          virtualJob: false
        }),
        EmberObject.create({
          id: '1234',
          name: 'main',
          isDisabled: false,
          virtualJob: false
        }),
        EmberObject.create({
          id: '2345',
          name: 'A',
          isDisabled: false,
          virtualJob: false
        }),
        EmberObject.create({
          id: '4567',
          name: 'long-long-long-long-long-long-long-long-long-long-long-job-name',
          isDisabled: false,
          virtualJob: false
        }),
        EmberObject.create({
          id: '8899',
          name: 'virtual-job-ci-setup',
          isDisabled: false,
          virtualJob: true
        })
      ])
    );

    await render(
      hbs`<PipelineOptions @pipeline={{this.mockPipeline}} @jobs={{this.mockJobs}} />`
    );

    // Pipeline
    assert.dom('section.pipeline h3').hasText('Pipeline');
    assert.dom('section.pipeline li').exists({ count: 6 });
    assert
      .dom('section.pipeline h4')
      .hasText('Checkout URL and Source Directory');
    assert
      .dom('section.pipeline p')
      .hasText('Update your checkout URL and / or source directory.');
    assert.dom('section.pipeline .button-label').hasText('Update');
    assert
      .dom('section > ul > li:nth-child(5) p')
      .hasText(
        'Pick your own preferred jobs to be counted in metrics graph (default all jobs)'
      );
    assert.dom('section > ul > li:nth-child(5) h4').hasText('Downtime Jobs');
    assert.equal(
      $('section > ul > li:nth-child(5) input').attr('placeholder'),
      'Select Jobs...'
    );
    assert.dom('section.pipeline li:nth-child(6) h4').hasText('Admins');
    assert
      .dom('section.pipeline li:nth-child(6) p')
      .hasText(
        'Users with admin permission to this pipeline. If you have write access to the repository, you can become a pipeline admin by starting/stopping builds or syncing the pipeline.'
      );
    assert
      .dom('section.pipeline li:nth-child(6) .admins-list')
      .hasText('admin1, admin2, admin3, admin4, admin5 ... more');

    await click('section.pipeline li:nth-child(6) .admins-list a');
    assert
      .dom('section.pipeline li:nth-child(6) .admins-list')
      .hasText('admin1, admin2, admin3, admin4, admin5, admin6 collapse');

    // Jobs
    assert.dom('section.jobs h3').hasText('Jobs');
    assert.dom('section.jobs li').exists({ count: 6 });
    assert.dom('section.jobs li:nth-child(2) h4').hasText('A');
    assert.dom('section.jobs li:nth-child(3) h4').hasText('B');
    assert
      .dom('section.jobs li:nth-child(4) h4')
      .hasText('long-long-long-long-long-long-long-long-long-long-...');
    assert.dom('section.jobs li:nth-child(5) h4').hasText('main');
    assert
      .dom('section.jobs li:nth-child(6) h4')
      .hasText('virtual-job-ci-setup virtual');
    assert
      .dom('section.jobs li:nth-child(6) h4 span.job-label')
      .hasText('virtual');
    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    // Sync
    assert.dom('section.sync li:first-child h4').hasText('SCM webhooks');
    assert.dom('section.sync li:nth-child(2) h4').hasText('Pull requests');
    assert.dom('section.sync li:last-child h4').hasText('Pipeline');

    // Cache
    assert.dom('section.cache li:first-child h4').hasText('Pipeline');
    assert.dom('section.cache li:nth-child(2) h4').hasText('Job A');
    assert.dom('section.cache li:nth-child(3) h4').hasText('Job B');
    assert
      .dom('section.cache li:nth-child(4) h4')
      .hasText('Job long-long-long-long-long-long-long-long-long-long-...');
    assert.dom('section.cache li:nth-child(5) h4').hasText('Job main');
    assert
      .dom('section.cache li:last-child h4')
      .hasText('Job virtual-job-ci-setup');

    // Danger Zone
    assert.dom('section.danger h3').hasText('Danger Zone');
    assert.dom('section.danger li').exists({ count: 1 });
    assert.dom('section.danger h4').hasText('Delete this pipeline');
    assert
      .dom('section.danger p')
      .hasText('Once you delete a pipeline, there is no going back.');
    assert.dom('section.danger a svg').hasClass('fa-trash');
  });

  test('it renders pipeline visibility toggle for private pipeline', async function (assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        scmRepo: { private: true }
      })
    );

    await render(
      hbs`<PipelineOptions @pipeline={{this.mockPipeline}} @jobs={{this.mockJobs}} />`
    );

    // Danger Zone
    assert.dom('section.danger h3').hasText('Danger Zone');
    assert.dom('section.danger li').exists({ count: 2 });
    assert
      .dom('section.danger li:first-child h4')
      .hasText('Set pipeline visibility');
    assert
      .dom('section.danger li:first-child p')
      .hasText('Think twice before setting pipeline to public.');
    assert
      .dom('section.danger li:first-child .x-toggle-container')
      .hasClass('x-toggle-container');

    await click('section.danger li:first-child .x-toggle-btn');
    assert.dom('section.danger li:first-child a').exists({ count: 2 });
    assert
      .dom('section.danger li:first-child h4')
      .hasText('Are you absolutely sure?');
    await click('section.danger li:first-child a.cancel');
    assert
      .dom('section.danger li:first-child h4')
      .hasText('Set pipeline visibility');

    await click('section.danger li:first-child .x-toggle-btn');
    assert
      .dom('section.danger li:first-child h4')
      .hasText('Are you absolutely sure?');

    assert
      .dom('section.danger li:nth-child(2) h4')
      .hasText('Delete this pipeline');
    assert
      .dom('section.danger li:nth-child(2) p')
      .hasText('Once you delete a pipeline, there is no going back.');
    assert.dom('section.danger li:nth-child(2) a svg').hasClass('fa-trash');
  });

  test('it updates a pipeline', async function (assert) {
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
      hbs`<PipelineOptions @pipeline={{this.mockPipeline}} @errorMessage="" @isSaving={{false}} @onUpdatePipeline={{action this.updatePipeline}} />`
    );
    assert.dom('.scm-url').hasValue('git@github.com:foo/bar.git#notMaster');
    assert.dom('.root-dir').doesNotExist();

    await fillIn('.scm-url', scm);
    await triggerKeyEvent('.text-input', 'keyup', 32);

    assert.dom('.scm-url').hasValue(scm);

    await click('button.blue-button');
  });

  test('it updates a pipeline with rootDir', async function (assert) {
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
      hbs`<PipelineOptions @pipeline={{this.mockPipeline}} @errorMessage="" @isSaving={{false}} @onUpdatePipeline={{action this.updatePipeline}} />`
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

  test('it opens job toggle modal', async function (assert) {
    assert.expect(11);

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
      },
      createRecord() {
        assert.ok(true, 'queryRecord called');

        return resolve({
          7: {
            showJobPRs: false
          }
        });
      },
      peekAll() {
        assert.ok(true, 'peekAll called');

        return A([
          EmberObject.create({
            id: '1',
            showPRJobs: true
          }),
          EmberObject.create({
            id: '7',
            showPRJobs: true
          }),
          EmberObject.create({
            id: '7290',
            displayJobNameLength: 20,
            showPRJobs: false
          })
        ]);
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

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeStub);

    await render(hbs`<PipelineOptions
      @username={{this.username}}
      @pipeline={{this.mockPipeline}}
      @jobs={{this.mockJobs}}
      @showToggleModal={{this.showToggleModal}}
    />`);

    assert.equal(this.showToggleModal, false);
    assert.dom('.modal').doesNotExist();

    await click('.x-toggle-btn');

    assert.equal(this.showToggleModal, true);
    // Make sure there is only 1 modal
    assert.dom('.modal').exists({ count: 1 });
    assert.dom('.modal-title').hasText('Disable the "main" job?');
    assert.dom('.message input').exists({ count: 1 });
    assert.dom('.toggle-form__cancel').hasText('Cancel');
    assert.dom('.toggle-form__create').hasText('Confirm');
  });

  test('it handles job disabling', async function (assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      state: 'ENABLED',
      stateChanger: 'tkyi',
      stateChangeMessage: 'foo',
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

    const jobServiceStub = Service.extend({
      setJobState: (id, state, message) => {
        assert.equal(id, '1234');
        assert.equal(state, 'DISABLED');
        assert.equal(message, 'testing');

        main.set('state', state);
        main.set('stateChanger', 'tkyi');
        main.set('stateChangeMessage', 'testing');
        main.set('isDisabled', true);

        return Promise.resolve();
      }
    });

    this.owner.unregister('service:job');
    this.owner.register('service:job', jobServiceStub);

    await render(hbs`<PipelineOptions
      @username={{this.username}}
      @pipeline={{this.mockPipeline}}
      @jobs={{this.mockJobs}}
    />`);

    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    await click('.x-toggle-btn');
    await fillIn('.message input', 'testing');
    await click('.toggle-form__create');

    assert.dom('section.jobs h4').hasText('main');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');
    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert
      .dom('section.jobs li:nth-child(2) p')
      .hasText('Disabled by tkyi: testing');
  });

  test('it handles job enabling', async function (assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      state: 'DISABLED',
      stateChangeMessage: 'testing',
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

    const jobServiceStub = Service.extend({
      setJobState: (id, state, message) => {
        assert.equal(id, '1234');
        assert.equal(state, 'ENABLED');
        assert.equal(message, ' ');

        main.set('state', state);
        main.set('stateChanger', 'tkyi');
        main.set('stateChangeMessage', ' ');
        main.set('isDisabled', false);

        return Promise.resolve();
      }
    });

    this.owner.unregister('service:job');
    this.owner.register('service:job', jobServiceStub);

    await render(hbs`<PipelineOptions
      @pipeline={{this.mockPipeline}}
      @jobs={{this.mockJobs}}
    />`);

    assert.dom('section.jobs h4').hasText('main');
    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');

    await click('.x-toggle-btn');
    await click('.toggle-form__create');

    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');
  });

  test('it handles job enabling long job name', async function (assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'long-long-long-long-long-long-long-long-long-long-long-job-name',
      state: 'DISABLED',
      stateChangeMessage:
        'This text is significantly longer than the specified maximum length of 50 characters',
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

    const jobServiceStub = Service.extend({
      setJobState: (id, state, message) => {
        assert.equal(id, '1234');
        assert.equal(state, 'ENABLED');
        assert.equal(
          message,
          'This text is significantly longer than the specified maximum length of 50 characters'
        );

        main.set('state', state);
        main.set('stateChanger', 'tkyi');
        main.set(
          'stateChangeMessage',
          'This text is significantly longer than the specified maximum length of 50 characters'
        );
        main.set('isDisabled', false);

        return Promise.resolve();
      }
    });

    this.owner.unregister('service:job');
    this.owner.register('service:job', jobServiceStub);

    await render(hbs`<PipelineOptions
      @pipeline={{this.mockPipeline}}
      @jobs={{this.mockJobs}}
    />`);

    assert
      .dom('section.jobs h4')
      .hasText('long-long-long-long-long-long-long-long-long-long-...');
    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');

    await click('.x-toggle-btn');
    await fillIn(
      '.message input',
      'This text is significantly longer than the specified maximum length of 50 characters'
    );
    await click('.toggle-form__create');

    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert
      .dom('section.jobs li:nth-child(2) p')
      .hasText(
        'Enabled by tkyi: This text is significantly longer than the specifi... more'
      );

    await click('.toggle-expand');

    assert
      .dom('section.jobs li:nth-child(2) p')
      .hasText(
        'Enabled by tkyi: This text is significantly longer than the specified maximum length of 50 characters less'
      );
  });

  test('it handles job disabling long job name', async function (assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'long-long-long-long-long-long-long-long-long-long-long-job-name',
      state: 'ENABLED',
      stateChanger: 'tkyi',
      stateChangeMessage:
        'This text is significantly longer than the specified maximum length of 50 characters',
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

    const jobServiceStub = Service.extend({
      setJobState: (id, state, message) => {
        assert.equal(id, '1234');
        assert.equal(state, 'DISABLED');
        assert.equal(
          message,
          'This text is significantly longer than the specified maximum length of 50 characters'
        );

        main.set('state', state);
        main.set('stateChanger', 'tkyi');
        main.set(
          'stateChangeMessage',
          'This text is significantly longer than the specified maximum length of 50 characters'
        );
        main.set('isDisabled', true);

        return Promise.resolve();
      }
    });

    this.owner.unregister('service:job');
    this.owner.register('service:job', jobServiceStub);

    await render(hbs`<PipelineOptions
      @username={{this.username}}
      @pipeline={{this.mockPipeline}}
      @jobs={{this.mockJobs}}
    />`);

    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    await click('.x-toggle-btn');
    await fillIn(
      '.message input',
      'This text is significantly longer than the specified maximum length of 50 characters'
    );
    await click('.toggle-form__create');

    assert
      .dom('section.jobs h4')
      .hasText('long-long-long-long-long-long-long-long-long-long-...');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');
    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert
      .dom('section.jobs li:nth-child(2) p')
      .hasText(
        'Disabled by tkyi: This text is significantly longer than the specifi... more'
      );

    await click('.toggle-expand');

    assert
      .dom('section.jobs li:nth-child(2) p')
      .hasText(
        'Disabled by tkyi: This text is significantly longer than the specified maximum length of 50 characters less'
      );
  });

  test('it fails to handle job enabling', async function (assert) {
    const main = EmberObject.create({
      id: '1234',
      name: 'main',
      state: 'DISABLED',
      stateChangeMessage: 'testing',
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

    const jobServiceStub = Service.extend({
      setJobState: () => reject('Error message')
    });

    this.owner.unregister('service:job');
    this.owner.register('service:job', jobServiceStub);

    await render(hbs`<PipelineOptions
      @pipeline={{this.mockPipeline}}
      @jobs={{this.mockJobs}}
    />`);

    assert.dom('section.jobs h4').hasText('main');
    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');

    await click('.x-toggle-btn');
    await click('.toggle-form__create');

    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');
    assert.dom('.alert > span').hasText('Error message');
  });

  test('it handles filterEventsForNobuilds enabling', async function (assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        settings: {
          groupedEvents: true,
          showEventTriggers: false,
          filterEventsForNoBuilds: false
        }
      })
    );

    const shuttleStub = Service.extend({
      // eslint-disable-next-line no-unused-vars
      updatePipelineSettings(pipelineId, settings) {
        assert.ok(true, 'updatePipelineSettings called');
        assert.equal(pipelineId, 'abc1234');
        assert.deepEqual(settings, {
          filterEventsForNoBuilds: true
        });

        return resolve({});
      }
    });

    const pipelineServiceStub = Service.extend({
      getUserPipelinePreference(pipelineId) {
        assert.ok(true, 'getUserPipelinePreference called');
        assert.equal(pipelineId, 'abc1234');

        return resolve({});
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);
    this.owner.unregister('service:pipeline');
    this.owner.register('service:pipeline', pipelineServiceStub);

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);

    assert
      .dom('section.preference li:nth-of-type(3) h4')
      .hasText('Filter Events For No Builds');
    assert
      .dom('section.preference li:nth-of-type(3) p')
      .hasText(
        'Setup your pipeline preference to not show events with no builds. (latest event is not hidden)'
      );
    assert
      .dom('section.preference li:nth-of-type(3) .x-toggle-container')
      .hasNoClass('x-toggle-container-checked');

    await click('section.preference li:nth-of-type(3) .x-toggle-btn');

    assert
      .dom('section.preference li:nth-of-type(1) .x-toggle-container')
      .hasClass('x-toggle-container-checked');
    assert
      .dom('section.preference li:nth-of-type(2) .x-toggle-container')
      .hasNoClass('x-toggle-container-checked');
    assert
      .dom('section.preference li:nth-of-type(3) .x-toggle-container')
      .hasClass('x-toggle-container-checked');
  });

  test('it updates pipeline sonar name and uri', async function (assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        settings: {
          groupedEvents: true,
          showEventTriggers: false,
          filterEventsForNoBuilds: false
        }
      })
    );

    const shuttleStub = Service.extend({
      // eslint-disable-next-line no-unused-vars
      updatePipelineSettings(pipelineId, settings) {
        assert.ok(true, 'updatePipelineSettings called');
        assert.equal(pipelineId, 'abc1234');
        assert.deepEqual(settings, {
          aliasName: 'test-pr'
        });

        return resolve({});
      }
    });

    const pipelineServiceStub = Service.extend({
      getUserPipelinePreference(pipelineId) {
        assert.ok(true, 'getUserPipelinePreference called');
        assert.equal(pipelineId, 'abc1234');

        return resolve({});
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);
    this.owner.unregister('service:pipeline');
    this.owner.register('service:pipeline', pipelineServiceStub);

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);

    assert.dom('section.pipeline li:nth-of-type(3) h4').hasText('Badges');
    assert
      .dom('section.pipeline li:nth-of-type(3) p')
      .hasText('Customize your own sonar badge dashboard and link');
    assert.dom('section.pipeline li:nth-of-type(3) input').hasNoText();

    const sonarName = 'sonar random name';
    const sonarUri = 'random sonar uri';

    await fillIn('section.pipeline li:nth-of-type(3) input', sonarName);

    assert.dom('section.pipeline li:nth-of-type(3) input').hasValue(sonarName);

    await fillIn('section.pipeline li:nth-of-type(3) input', sonarUri);

    assert.dom('section.pipeline li:nth-of-type(3) input').hasValue(sonarUri);
  });

  test('it updates pipeline aliasName', async function (assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        settings: {
          groupedEvents: true,
          showEventTriggers: false,
          filterEventsForNoBuilds: false
        }
      })
    );

    const shuttleStub = Service.extend({
      // eslint-disable-next-line no-unused-vars
      updatePipelineSettings(pipelineId, settings) {
        assert.ok(true, 'updatePipelineSettings called');
        assert.equal(pipelineId, 'abc1234');
        assert.deepEqual(settings, {
          aliasName: 'test-pr'
        });

        return resolve({});
      }
    });

    const pipelineServiceStub = Service.extend({
      getUserPipelinePreference(pipelineId) {
        assert.ok(true, 'getUserPipelinePreference called');
        assert.equal(pipelineId, 'abc1234');

        return resolve({});
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);
    this.owner.unregister('service:pipeline');
    this.owner.register('service:pipeline', pipelineServiceStub);

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);

    assert
      .dom('section.pipeline li:nth-of-type(4) h4')
      .hasText('Pipeline alias');
    assert
      .dom('section.pipeline li:nth-of-type(4) p')
      .hasText(
        'Setup your own preferred pipeline name for the dashboard list view.'
      );
    assert.dom('section.pipeline li:nth-of-type(4) input').hasNoText();

    await fillIn('section.pipeline li:nth-of-type(4) input', 'test-pr');

    assert.dom('section.pipeline li:nth-of-type(4) input').hasValue('test-pr');
  });

  test('it handles pipeline remove flow', async function (assert) {
    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        scmRepo: {
          name: 'test/test-pipeline'
        }
      })
    );

    this.set('removePipelineMock', () => {
      assert.ok(true);
    });

    await render(
      hbs`<PipelineOptions @pipeline={{this.mockPipeline}} @onRemovePipeline={{this.removePipelineMock}} />`
    );

    assert.dom('section.danger h4').hasText('Delete this pipeline');

    await click('section.danger a');

    assert.dom('.modal-dialog').exists();
    assert.dom('.modal-dialog h4').hasText('Are you absolutely sure?');
    // starts with button disabled
    assert.dom('.modal-footer .delete-pipeline-btn').isDisabled();

    // cancel button closes the modal
    await click('.modal-footer .delete-pipeline-cancel');
    assert.dom('.modal-dialog').doesNotExist();

    await click('section.danger a');
    assert.dom('.modal-dialog').exists();
    assert.dom('.modal-dialog h4').hasText('Are you absolutely sure?');

    await fillIn('.modal-body input', 'screwdriver');
    // wrong pipeline name button is still disabled
    assert.dom('.modal-footer .delete-pipeline-btn').isDisabled();

    await click('.modal-footer .delete-pipeline-cancel');

    await click('section.danger a');
    assert.dom('.modal-dialog').exists();
    assert.dom('.modal-dialog h4').hasText('Are you absolutely sure?');

    await fillIn('.modal-body input', 'test/test-pipeline');
    // correct pipeline so button is enable
    assert.dom('.modal-footer .delete-pipeline-btn').isEnabled();

    await click('.modal-footer .delete-pipeline-btn');
    assert.dom('.modal-dialog').doesNotExist();

    assert.dom('section.danger p').hasText('Please wait...');
  });

  test('it syncs the webhooks', async function (assert) {
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

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);

    await click('section.sync a');
  });

  test('it syncs the pullrequests', async function (assert) {
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

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);
    await click('section.sync li:nth-child(2) a');
  });

  test('it syncs the pipeline', async function (assert) {
    syncService = Service.extend({
      syncRequests(pipelineId, syncPath) {
        assert.equal(pipelineId, 1);
        assert.equal(syncPath, undefined);

        return resolve({});
      }
    });
    const store = this.owner.lookup('service:store');

    sinon.stub(store, 'findRecord');
    this.owner.register('service:sync', syncService);

    this.set(
      'mockPipeline',
      EmberObject.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      })
    );

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);
    await click('section.sync li:nth-child(3) a');
    assert.ok(store.findRecord.calledWith('pipeline', '1'));
  });

  test('it fails to sync the pipeline', async function (assert) {
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

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);

    await click('section.sync li:nth-child(3) a');

    assert.dom('.alert > span').hasText('something conflicting');
  });

  test('it does not render pipeline and danger for child pipeline', async function (assert) {
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
        }),
        EmberObject.create({
          id: '1',
          name: 'PR-123:component',
          isDisabled: false
        })
      ])
    );

    await render(
      hbs`<PipelineOptions @pipeline={{this.mockPipeline}} @jobs={{this.mockJobs}} />`
    );

    // Pipeline should not render
    assert.dom('section.pipeline h3').doesNotExist();

    // Jobs should render
    assert.dom('section.jobs h3').hasText('Jobs');
    assert.dom('section.jobs li').exists({ count: 4 });
    assert.dom('section.jobs li:nth-child(2) h4').hasText('A');
    assert.dom('section.jobs li:nth-child(3) h4').hasText('B');
    assert.dom('section.jobs li:nth-child(4) h4').hasText('main');

    // PR Job should not render
    assert.dom('section.jobs li:nth-child(5) h4').doesNotExist();

    // eslint-disable-next-line max-len
    assert
      .dom('section.jobs p')
      .hasText('Toggle to disable or enable the job.');
    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');

    // Sync should render
    assert.dom('section.sync li:first-child h4').hasText('SCM webhooks');
    assert.dom('section.sync li:nth-child(2) h4').hasText('Pull requests');
    assert.dom('section.sync li:last-child h4').hasText('Pipeline');

    // Cache should render
    assert.dom('section.cache li:first-child h4').hasText('Pipeline');
    assert.dom('section.cache li:nth-child(2) h4').hasText('Job A');
    assert.dom('section.cache li:nth-child(3) h4').hasText('Job B');
    assert.dom('section.cache li:nth-child(4) h4').hasText('Job main');

    // Danger Zone should not render
    assert.dom('section.danger h3').doesNotExist();
  });

  test('it clears the pipeline cache', async function (assert) {
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

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);
    await click('section.cache a');
  });

  test('it clears the job cache', async function (assert) {
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

    await render(
      hbs`<PipelineOptions @pipeline={{this.mockPipeline}} @jobs={{this.mockJobs}} />`
    );
    await click('section.cache li:nth-child(2) a');
  });

  test('it fails to clear the cache for the pipeline', async function (assert) {
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

    await render(hbs`<PipelineOptions @pipeline={{this.mockPipeline}} />`);

    await click('section.cache a');

    assert.dom('.alert > span').hasText('something conflicting');
  });
});
