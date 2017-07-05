import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
/* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }]*/

let syncService;

moduleForComponent('pipeline-options', 'Integration | Component | pipeline options', {
  integration: true
});

test('it renders', function (assert) {
  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: 'abc1234',
    jobs: Ember.A([
      Ember.Object.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      })
    ])
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

  // Pipeline
  assert.equal(this.$('section.pipeline h3').text().trim(), 'Pipeline');
  assert.equal(this.$('section.pipeline li').length, 1);
  assert.equal(this.$('section.pipeline h4').text().trim(), 'Checkout URL');
  assert.equal(this.$('section.pipeline p').text().trim(), 'Update your checkout URL.');
  assert.equal(this.$('section.pipeline .button-label').text().trim(), 'Update');

  // Jobs
  assert.equal(this.$('section.jobs h3').text().trim(), 'Jobs');
  assert.equal(this.$('section.jobs li').length, 1);
  assert.equal(this.$('section.jobs h4').text().trim(), 'main');
  assert.equal(this.$('section.jobs p').text().trim(), 'Toggle to disable the main job.');
  assert.ok(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));

  // Sync
  assert.equal(this.$(this.$('section.sync h4').get(0)).text().trim(), 'SCM webhooks');
  assert.equal(this.$(this.$('section.sync h4').get(1)).text().trim(), 'Pull requests');
  assert.equal(this.$(this.$('section.sync h4').get(2)).text().trim(), 'Pipeline');

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

  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:notMaster',
    id: 'abc1234'
  }));

  // eslint-disable-next-line max-len
  this.render(hbs`{{pipeline-options pipeline=mockPipeline errorMessage="" isSaving=false onUpdatePipeline=updatePipeline}}`);
  assert.equal(this.$('.text-input').val(), 'git@github.com:foo/bar.git#notMaster');
  this.$('.text-input').val(scm).keyup();
  assert.equal(this.$('.text-input').val(), scm);
  this.$('button.blue-button').click();
});

test('it handles job disabling', function (assert) {
  const main = Ember.Object.create({
    id: '1234',
    name: 'main',
    isDisabled: false
  });

  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: 'abc1234',
    jobs: Ember.A([main])
  }));

  this.set('setJobStatsMock', (id, state) => {
    assert.equal(id, '1234');
    assert.equal(state, 'DISABLED');
    main.set('isDisabled', true);
  });

  this.render(hbs`{{pipeline-options pipeline=mockPipeline setJobStatus=setJobStatsMock}}`);

  assert.ok(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));
  this.$('.x-toggle-btn').click();

  assert.equal(this.$('section.jobs h4').text().trim(), 'main');
  assert.equal(this.$('section.jobs p').text().trim(), 'Toggle to enable the main job.');
  assert.notOk(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));
});

test('it handles job enabling', function (assert) {
  const main = Ember.Object.create({
    id: '1234',
    name: 'main',
    isDisabled: true
  });

  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: 'abc1234',
    jobs: Ember.A([main])
  }));

  this.set('setJobStatsMock', (id, state) => {
    assert.equal(id, '1234');
    assert.equal(state, 'ENABLED');
    main.set('isDisabled', false);
  });

  this.render(hbs`{{pipeline-options pipeline=mockPipeline setJobStatus=setJobStatsMock}}`);

  assert.equal(this.$('section.jobs h4').text().trim(), 'main');
  assert.equal(this.$('section.jobs p').text().trim(), 'Toggle to enable the main job.');
  assert.notOk(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));
  this.$('.x-toggle-btn').click();

  assert.equal(this.$('section.jobs h4').text().trim(), 'main');
  assert.equal(this.$('section.jobs p').text().trim(), 'Toggle to disable the main job.');
  assert.ok(this.$('.x-toggle-container').hasClass('x-toggle-container-checked'));
});

test('it handles pipeline remove flow', function (assert) {
  const $ = this.$;

  this.set('mockPipeline', Ember.Object.create({
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
  syncService = Ember.Service.extend({
    syncRequests(pipelineId, syncPath) {
      assert.equal(pipelineId, 1);
      assert.equal(syncPath, 'webhooks');

      return Ember.RSVP.resolve({});
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
  $($('section.sync a').get(0)).click();
});

test('it syncs the pullrequests', function (assert) {
  syncService = Ember.Service.extend({
    syncRequests(pipelineId, syncPath) {
      assert.equal(pipelineId, 1);
      assert.equal(syncPath, 'pullrequests');

      return Ember.RSVP.resolve({});
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
  $($('section.sync a').get(1)).click();
});

test('it syncs the pipeline', function (assert) {
  syncService = Ember.Service.extend({
    syncRequests(pipelineId, syncPath) {
      assert.equal(pipelineId, 1);
      assert.equal(syncPath, undefined);

      return Ember.RSVP.resolve({});
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);
  $($('section.sync a').get(2)).click();
});

test('it fails to sync the pipeline', function (assert) {
  syncService = Ember.Service.extend({
    syncRequests() {
      return Ember.RSVP.reject('something conflicting');
    }
  });

  this.register('service:sync', syncService);

  const $ = this.$;

  this.set('mockPipeline', Ember.Object.create({
    appId: 'foo/bar',
    scmUri: 'github.com:84604643:master',
    id: '1'
  }));

  this.render(hbs`{{pipeline-options pipeline=mockPipeline}}`);

  $($('section.sync a').get(2)).click();

  return wait()
    .then(() => {
      assert.equal(this.$('.info-message span').text().trim(), 'something conflicting');
    });
});
