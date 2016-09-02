import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-header', 'Integration | Component | pipeline header', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelineMock = {
    appId: 'batman/batmobile',
    hubUrl: 'http://example.com/batman/batmobile',
    repoData: {
      branch: 'master'
    }
  };

  this.set('pipelineMock', pipelineMock);
  this.render(hbs`{{pipeline-header pipeline=pipelineMock}}`);

  assert.equal(this.$('h1').text().trim(), 'batman/batmobile');
  assert.equal(this.$('.branch').text().trim(), 'master');
  assert.equal(this.$('a')[0].href, 'http://example.com/batman/batmobile');
});
