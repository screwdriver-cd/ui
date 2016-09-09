import { moduleForComponent, test } from 'ember-qunit';
import Ember from 'ember';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import Pretender from 'pretender';
let server;

const singleRequest = () => {
  server.get('http://localhost:8080/v3/builds/1/steps/banana/logs/', () => [
    200,
    {
      'Content-Type': 'application/json',
      'x-more-data': false
    },
    JSON.stringify([{
      t: Date.now(),
      n: 0,
      m: 'hello, world'
    }])
  ]);
};

moduleForComponent('build-log', 'Integration | Component | build log', {
  integration: true,

  beforeEach() {
    server = new Pretender();
  },

  afterEach() {
    server.shutdown();
  }
});

test('it renders closed', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const stepMock = { name: 'banana' };

  this.set('stepMock', stepMock);

  this.render(hbs`{{build-log buildId=1 step=stepMock isOpen=false}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#build-log buildId=1 step=stepMock isOpen=false}}
      template block text
    {{/build-log}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});

test('it renders open when told to', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const stepMock = {
    name: 'banana',
    code: 127,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  };
  const buildMock = Ember.Object.extend({
    reload() {}
  }).create({
    id: '1',
    status: 'RUNNING'
  });

  server.map(singleRequest);
  this.set('stepMock', stepMock);
  this.set('buildMock', buildMock);

  this.render(hbs`{{build-log build=buildMock step=stepMock isOpen=true}}`);

  return wait().then(() => {
    assert.equal(this.$().text().trim(), 'hello, world');
  });
});

test('it starts loading when open changes', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const stepMock = {
    name: 'banana',
    code: 127,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  };
  const buildMock = Ember.Object.extend({
    reload() {}
  }).create({
    id: '1',
    status: 'RUNNING'
  });

  server.map(singleRequest);
  this.set('stepMock', stepMock);
  this.set('buildMock', buildMock);
  this.set('open', false);

  this.render(hbs`{{build-log build=buildMock step=stepMock isOpen=open}}`);
  this.set('open', true);

  return wait().then(() => {
    assert.equal(this.$().text().trim(), 'hello, world');
  });
});

test('it does not start loading when only step changes', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const stepMock = {
    name: 'banana'
  };

  server.map(singleRequest);
  this.set('stepMock', stepMock);
  this.set('open', false);

  this.render(hbs`{{build-log buildId=1 step=stepMock isOpen=open}}`);
  this.set('stepMock', {
    name: 'banana',
    code: 127,
    startTime: '2016-08-26T20:49:42.531Z',
    endTime: '2016-08-26T20:50:52.531Z'
  });
  assert.equal(this.$().text().trim(), '');
});
