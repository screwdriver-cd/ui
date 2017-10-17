import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-workflow', 'Integration | Component | pipeline workflow', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const jobs = ['main', 'batman', 'robin'].map((name) => {
    const j = {
      name,
      isDisabled: false,
      lastBuild: EmberObject.create({
        id: 12345,
        status: 'SUCCESS',
        sha: 'abcd1234'
      })
    };

    return EmberObject.create(j);
  });

  this.set('jobsMock', jobs);

  this.render(hbs`{{pipeline-workflow jobs=jobsMock}}`);

  assert.equal(this.$('.build-bubble').length, 3);
});
