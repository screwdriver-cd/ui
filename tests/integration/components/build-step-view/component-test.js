import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-step-view', 'Integration | Component | build step view', {
  integration: true
});

test('it renders and handles clicks', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  let count = 0;
  let open = false;
  const $ = this.$;

  this.set('open', open);
  this.set('toggle', () => {
    count += 1;
    open = !open;
    this.set('open', open);
  });

  this.render(hbs`{{build-step-view
    code=0
    endTime='2016-08-26T20:50:52.531Z'
    isOpen=open
    onToggle=(action toggle)
    startTime='2016-08-26T20:49:42.531Z'
    stepName='banana'
  }}`);

  assert.notOk(this.get('isOpen'));
  assert.ok($($('.status-icon i').get(0)).hasClass('fa-check'), 'success icon');
  assert.equal($('.name').text().trim(), 'banana');
  assert.equal($('.duration').text().trim(), '1 minute, 10 seconds');
  assert.ok($($('.chevron i').get(0)).hasClass('fa-chevron-down'),
    'chevron down before click');
  $('.name').click();
  assert.ok($($('.chevron i').get(0)).hasClass('fa-chevron-up'),
    'chevron up after click');
  $('.name').click();
  assert.ok($($('.chevron i').get(0)).hasClass('fa-chevron-down'),
    'chevron down after click');
  assert.equal(count, 2);
});

test('it has no icon when queued', function (assert) {
  this.render(hbs`{{build-step-view
    code=undefined
    endTime=undefined
    isOpen=false
    startTime=undefined
    stepName='banana'
  }}`);

  assert.equal(this.$('.status-icon i').length, 0);
});

test('it has a spinner when running', function (assert) {
  this.render(hbs`{{build-step-view
    code=undefined
    endTime=undefined
    isOpen=false
    startTime='2016-08-26T20:49:42.531Z'
    stepName='banana'
  }}`);

  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-spinner'));
});

test('it has an "x" when failed', function (assert) {
  this.render(hbs`{{build-step-view
    code=127
    endTime='2016-08-26T20:50:52.531Z'
    isOpen=false
    startTime='2016-08-26T20:49:42.531Z'
    stepName='banana'
  }}`);

  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-times'));
});
