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
  let hasBanner = false;
  let hasSteps = false;
  let hasDetails = false;

  this.set('buildMock', buildMock);
  this.render(hbs`{{build-layout build=buildMock}}`);

  // layout has wrapper
  assert.equal(this.$('.buildPage').length, 1);

  // Ember adds a random identifier to the end of the component classname, making it difficult to find them
  const views = this.$('.ember-view');

  for (let i = 0; i < views.length; i += 1) {
    let v = views[i];

    if (/build-banner-/.test(v.className)) {
      hasBanner = true;
    }
    if (/build-step-collection/.test(v.className)) {
      hasSteps = true;
    }
    if (/build-details/.test(v.className)) {
      hasDetails = true;
    }
  }

  assert.ok(hasBanner, 'missing banner');
  assert.ok(hasSteps, 'missing steps');
  assert.ok(hasDetails, 'missing details');
});
