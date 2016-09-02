import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-step-view', 'Integration | Component | build step view', {
  integration: true
});

test('it renders and handles clicks', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = { id: 1 };
  const stepMock = {
    name: 'banana',
    code: 0,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  };
  let count = 0;
  let open = false;

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);
  this.set('open', open);
  this.set('externalAction', () => {
    count += 1;
    open = !open;
    this.set('open', open);
  });

  // eslint-disable-next-line max-len
  this.render(hbs`{{build-step-view build=buildMock step=stepMock isOpen=open onToggle=(action externalAction)}}`);

  assert.notOk(this.get('isOpen'));
  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-check'), 'success icon');
  assert.equal(this.$('.name').text().trim(), 'banana');
  assert.equal(this.$('.duration').text().trim(), 'a minute');
  assert.ok(this.$(this.$('.chevron i').get(0)).hasClass('fa-chevron-down'),
    'chevron down before click');
  this.$('.name').click();
  assert.ok(this.$(this.$('.chevron i').get(0)).hasClass('fa-chevron-up'),
    'chevron up after click');
  this.$('.name').click();
  assert.ok(this.$(this.$('.chevron i').get(0)).hasClass('fa-chevron-down'),
    'chevron down after click');
  assert.equal(count, 2);
});

test('it is queued', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = { id: 1 };
  const stepMock = {
    name: 'banana'
  };

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{build-step-view build=buildMock step=stepMock}}`);

  assert.equal(this.$('.status-icon i').length, 0);
});

test('it is running', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = { id: 1 };
  const stepMock = {
    name: 'banana',
    startTime: '2016-08-26T20:49:42.531Z'
  };

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{build-step-view build=buildMock step=stepMock}}`);

  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-spinner'));
});

test('it is failed', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = { id: 1 };
  const stepMock = {
    name: 'banana',
    code: 127,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  };

  this.set('buildMock', buildMock);
  this.set('stepMock', stepMock);

  this.render(hbs`{{build-step-view build=buildMock step=stepMock}}`);

  assert.ok(this.$(this.$('.status-icon i').get(0)).hasClass('fa-times'));
});
