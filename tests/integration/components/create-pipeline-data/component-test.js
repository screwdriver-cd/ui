import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('create-pipeline-data', 'Integration | Component | create pipeline data', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{create-pipeline-data}}`);

  assert.equal(this.$('.scm-url').prop('placeholder').trim(),
    'Enter your repository link (eg: git@github.com:screwdriver-cd/ui.git#master)');
  assert.equal(this.$('.blue-button').val().trim(), 'Use this repository');
  assert.equal(this.$('.blue-button').prop('disabled'), true);
});

test('it handles successful submission of scmUrl', function (assert) {
  assert.expect(5);
  const scm = 'git@github.com:foo/bar.git';

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('scmData', scm);
  this.set('rememberProjectData', (scmUrl) => {
    assert.equal(scmUrl, scm);
  });
  // eslint-disable-next-line max-len
  this.render(hbs`{{create-pipeline-data scmUrl=scmData updateData=(action rememberProjectData)}}`);

  assert.equal(this.$('.scm-url').val().trim(), scm);
  assert.equal(this.$('.scm-url').hasClass('good-text-input'), true);
  assert.equal(this.$('.blue-button').prop('disabled'), false);
  this.$('.blue-button').click();
});

test('it handles bad scmUrl', function (assert) {
  assert.expect(3);
  const scm = 'git@github.com%foo/bar.git';

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('scmData', scm);
  // eslint-disable-next-line max-len
  this.render(hbs`{{create-pipeline-data scmUrl=scmData}}`);

  assert.equal(this.$('.scm-url').val().trim(), scm);
  assert.equal(this.$('.scm-url').hasClass('bad-text-input'), true);
  assert.equal(this.$('.blue-button').prop('disabled'), true);
});

test('it handles updating scmUrl', function (assert) {
  assert.expect(3);
  const scm = 'git@github.com:foo/bar.git';

  this.set('updateStep', (step) => {
    assert.equal(step, 1);
  });

  // eslint-disable-next-line max-len
  this.render(hbs`{{create-pipeline-data scmUrl=scmData returnToStep=(action updateStep)}}`);

  this.$('.scm-url').val(scm).keyup();
  assert.equal(this.$('.scm-url').hasClass('good-text-input'), true);
  assert.equal(this.$('.blue-button').prop('disabled'), false);
});
