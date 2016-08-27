import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('sd-build-banner', 'Integration | Component | sd build banner', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = {
    status: 'SUCCESS',
    cause: 'monkeys with typewriters'
  };

  this.set('buildMock', buildMock);
  this.render(hbs`{{sd-build-banner build=buildMock}}`);

  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-check'));
  assert.equal(this.$('.cause').text().trim(), buildMock.cause);
  assert.equal(this.$('.branch').text().trim(), 'banana');
  assert.equal(this.$('.job').text().trim(), 'main');

  this.set('buildMock.status', 'QUEUED');
  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-clock-o'));

  this.set('buildMock.status', 'RUNNING');
  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-spinner'));
  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-spin'));

  this.set('buildMock.status', 'FAILURE');
  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-times'));
});
