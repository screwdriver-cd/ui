import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
const storageKey = 'create-pipeline-data';

moduleForComponent('pipeline-create-form', 'Integration | Component | pipeline create form', {
  integration: true,

  beforeEach() {
    localStorage.removeItem(storageKey);
  }
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{pipeline-create-form errorMessage="" isSaving=false saveSuccess=false}}`);

  assert.equal($($('.step-number span')[0]).text().trim(), '1');
  assert.equal($($('.step-number span')[1]).text().trim(), '2');
  assert.equal($($('.step-title')[0]).text().trim(), 'Select a Repository');
  assert.equal($($('.step-title')[1]).text().trim(), 'Create Pipeline');
  assert.equal($('.button-label').text().trim(), 'Create Pipeline');
});

test('it handles the entire ui flow', function (assert) {
  assert.expect(1);
  const scm = 'git@github.com:foo/bar.git';

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('scmUrl', scm);
  this.set('createPipeline', (scmUrl) => {
    assert.equal(scmUrl, scm);
  });

  // eslint-disable-next-line max-len
  this.render(hbs`{{pipeline-create-form errorMessage="" isSaving=false saveSuccess=false onCreatePipeline=(action createPipeline)}}`);
  this.$('.scm-url').val(scm).keyup();
  this.$('input.blue-button').click();
  this.$('button.blue-button').click();
});

test('it handles the entire ui flow', function (assert) {
  assert.expect(3);
  const scm = 'git@github.com:foo/bar.git';

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('scmUrl', scm);
  this.set('createPipeline', (scmUrl) => {
    assert.equal(scmUrl, scm);
  });
  this.set('save', false);

  // eslint-disable-next-line max-len
  this.render(hbs`{{pipeline-create-form errorMessage="" isSaving=false saveSuccess=save onCreatePipeline=(action createPipeline)}}`);
  this.$('.scm-url').val(scm).keyup();
  this.$('input.blue-button').click();
  this.$('button.blue-button').click();
  assert.equal(JSON.parse(localStorage.getItem(storageKey)), scm);
  this.set('save', true);
  assert.equal(JSON.parse(localStorage.getItem(storageKey)), undefined);
});
