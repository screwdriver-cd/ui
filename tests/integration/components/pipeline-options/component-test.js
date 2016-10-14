import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
/* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }]*/

moduleForComponent('pipeline-options', 'Integration | Component | pipeline options', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('mockPipeline', Ember.Object.create({
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

  // Jobs
  assert.equal(this.$('section.jobs h3').text().trim(), 'Jobs');
  assert.equal(this.$('section.jobs li').length, 1);
  assert.equal(this.$('section.jobs h4').text().trim(), 'Disable main');
  assert.equal(this.$('section.jobs p').text().trim(), 'Stop the line by disabling the main job.');
  assert.ok(this.$('section.jobs a i').hasClass('fa-lock'));

  // Danger Zone
  assert.equal(this.$('section.danger h3').text().trim(), 'Danger Zone');
  assert.equal(this.$('section.danger li').length, 1);
  assert.equal(this.$('section.danger h4').text().trim(), 'Remove this pipeline');
  assert.equal(this.$('section.danger p').text().trim(),
    'Once you remove a pipeline, there is no going back.');
  assert.ok(this.$('section.danger a i').hasClass('fa-trash'));
});

test('it handles job disabling', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const main = Ember.Object.create({
    id: '1234',
    name: 'main',
    isDisabled: false
  });

  this.set('mockPipeline', Ember.Object.create({
    id: 'abc1234',
    jobs: Ember.A([main])
  }));

  this.set('setJobStatsMock', (id, state) => {
    assert.equal(id, '1234');
    assert.equal(state, 'DISABLED');
    main.set('isDisabled', true);
  });

  this.render(hbs`{{pipeline-options pipeline=mockPipeline setJobStatus=setJobStatsMock}}`);

  assert.ok(this.$('section.jobs a i').hasClass('fa-lock'));
  this.$('section.jobs a').click();

  assert.equal(this.$('section.jobs h4').text().trim(), 'Enable main');
  assert.equal(this.$('section.jobs p').text().trim(),
    'Get your main job running again.');
  assert.ok(this.$('section.jobs a i').hasClass('fa-unlock'));
});

test('it handles job enabling', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const main = Ember.Object.create({
    id: '1234',
    name: 'main',
    isDisabled: true
  });

  this.set('mockPipeline', Ember.Object.create({
    id: 'abc1234',
    jobs: Ember.A([main])
  }));

  this.set('setJobStatsMock', (id, state) => {
    assert.equal(id, '1234');
    assert.equal(state, 'ENABLED');
    main.set('isDisabled', false);
  });

  this.render(hbs`{{pipeline-options pipeline=mockPipeline setJobStatus=setJobStatsMock}}`);

  assert.equal(this.$('section.jobs h4').text().trim(), 'Enable main');
  assert.equal(this.$('section.jobs p').text().trim(),
    'Get your main job running again.');
  assert.ok(this.$('section.jobs a i').hasClass('fa-unlock'));
  this.$('section.jobs a').click();

  assert.equal(this.$('section.jobs h4').text().trim(), 'Disable main');
  assert.equal(this.$('section.jobs p').text().trim(), 'Stop the line by disabling the main job.');
  assert.ok(this.$('section.jobs a i').hasClass('fa-lock'));
});

test('it handles pipeline remove flow', function (assert) {
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('mockPipeline', Ember.Object.create({
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
