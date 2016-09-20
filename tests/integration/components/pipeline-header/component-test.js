import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-header', 'Integration | Component | pipeline header', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
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

  assert.equal($('h1').text().trim(), 'batman/batmobile');
  assert.equal($($('a').get(1)).text().trim(), 'master');
  assert.equal($($('a').get(1)).attr('href'), 'http://example.com/batman/batmobile');
});
