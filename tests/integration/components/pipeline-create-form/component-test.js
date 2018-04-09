import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-create-form', 'Integration | Component | pipeline create form', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{pipeline-create-form errorMessage="" isSaving=false}}`);

  assert.equal($('h1').text().trim(), 'Create Pipeline');
  assert.equal($('.button-label').text().trim(), 'Create Pipeline');
});

test('it handles the entire ui flow', function (assert) {
  assert.expect(2);
  const scm = 'git@github.com:foo/bar.git';

  this.set('createPipeline', (scmUrl) => {
    assert.equal(scmUrl, scm);
  });

  // eslint-disable-next-line max-len
  this.render(hbs`{{pipeline-create-form errorMessage="" isSaving=false onCreatePipeline=(action createPipeline)}}`);
  this.$('.text-input').val(scm).keyup();
  assert.ok(this.$('i.fa').hasClass('fa-check'), 'success icon');
  this.$('button.blue-button').click();
});
