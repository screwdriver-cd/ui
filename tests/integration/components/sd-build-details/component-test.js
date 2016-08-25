import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import moment from 'moment';

moduleForComponent('sd-build-details', 'Integration | Component | sd build details', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  //
  const now = 1472244582531;
  const buildMock = {
    sha: '12345678901234567890',
    buildContainer: 'node:6',
    createTime: now - 180000,
    startTime: now - 175000,
    endTime: now,
    buildDuration: 175,
    queuedDuration: 5
  };
  this.set('buildMock', buildMock);
  this.render(hbs`{{sd-build-details build=buildMock}}`);

  assert.equal(this.$('.sha').text().trim(), '#123456');
  assert.equal(this.$('.container').text().trim(), 'node:6');
  assert.equal(this.$('.container')[0].href, 'https://hub.docker.com/_/node/');
  assert.equal(this.$('.created').text().trim(), moment(buildMock.createTime).format('lll'));
  assert.equal(this.$('.started').text().trim(), moment(buildMock.startTime).format('lll'));
  assert.equal(this.$('.completed').text().trim(), moment(buildMock.endTime).format('lll'));
  assert.equal(this.$('.buildDuration').text().trim(), '3 minutes');
  assert.equal(this.$('.queuedDuration').text().trim(), 'a few seconds');
});
