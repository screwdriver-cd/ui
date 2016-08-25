import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

moduleForComponent('sd-build-step', 'Integration | Component | sd build step', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = { id: 1 };
  const stepMock = {
    name: 'banana',
    code: 0,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  };
  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{sd-build-step build=buildMock step=stepMock}}`);

  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-check'));
  assert.equal(this.$('.name').text().trim(), 'banana');
  assert.equal(this.$('.duration').text().trim(), 'a minute');
  assert.ok(this.$(this.$('.chevron i').get(0)).hasClass('fa-chevron-down'));
  this.$('.name').click();
  assert.ok(this.$(this.$('.chevron i').get(0)).hasClass('fa-chevron-up'));
  this.$('.name').click();
  assert.ok(this.$(this.$('.chevron i').get(0)).hasClass('fa-chevron-down'));
  return wait().then(() => {
    assert.ok(this.$(this.$('.chevron i').get(0)).hasClass('fa-chevron-down'));
  });
});
