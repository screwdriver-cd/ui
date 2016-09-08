import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-layout', 'Integration | Component | build layout', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const now = 1472244582531;
  const buildMock = {
    sha: '12345678901234567890',
    buildContainer: 'node:6',
    createTime: now - 180000,
    startTime: now - 175000,
    endTime: now,
    buildDuration: 175,
    queuedDuration: 5,
    steps: [{ name: 'banana' }]
  };

  this.set('buildMock', buildMock);
  this.render(hbs`{{build-layout build=buildMock}}`);

  // layout has wrapper
  assert.equal(this.$('.buildPage').length, 1);

  assert.equal(this.$('.build-banner').length, 1);
  assert.equal(this.$('.build-step-collection').length, 1);
  assert.equal(this.$('.build-details').length, 1);
});
