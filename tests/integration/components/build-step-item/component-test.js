import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-step-item', 'Integration | Component | build step item', {
  integration: true
});

test('it renders and calls click handler', function (assert) {
  assert.expect(4);
  this.set('mockClick', name => assert.equal(name, 'monkey'));
  this.render(hbs`{{build-step-item
    selectedStep="banana"
    stepName="monkey"
    stepStart='2016-08-26T20:50:51.531Z'
    stepEnd="2016-08-26T20:50:52.531Z"
    stepCode=0
    onClick=(action mockClick)
  }}`);

  assert.equal(this.$('.name').text().trim(), 'monkey');
  assert.ok(this.$('i.fa').hasClass('fa-check'), 'success icon');
  assert.equal(this.$('.duration').text().trim(), '1 second');
  this.$('.name').click();
});

test('it renders an X when failed', function (assert) {
  this.render(hbs`{{build-step-item
    selectedStep="banana"
    stepName="monkey"
    stepStart='2016-08-26T20:50:51.531Z'
    stepEnd="2016-08-26T20:50:52.531Z"
    stepCode=128
  }}`);

  assert.ok(this.$('i.fa').hasClass('fa-times'), 'fail icon');
});

test('it renders an O when not run', function (assert) {
  this.render(hbs`{{build-step-item
    selectedStep="banana"
    stepName="monkey"
  }}`);

  assert.ok(this.$('i.fa').hasClass('fa-circle-o'), 'empty icon');
});

test('it renders an spinner when running', function (assert) {
  this.render(hbs`{{build-step-item
    selectedStep="banana"
    stepName="monkey"
    stepStart='2016-08-26T20:50:51.531Z'
  }}`);

  assert.ok(this.$('i.fa').hasClass('fa-spinner'), 'spin icon');
});
