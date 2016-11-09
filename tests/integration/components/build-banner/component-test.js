import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('build-banner', 'Integration | Component | build banner', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = {
    status: 'SUCCESS',
    cause: 'monkeys with typewriters',
    buildContainer: 'node:6',
    sha: 'abcd1234567890',
    buildDuration: '5 seconds'
  };
  const jobMock = {
    name: 'PR-671'
  };
  const pipelineMock = {
    appId: 'foo:bar',
    branch: 'master',
    hubUrl: 'http://github.com/foo/bar'
  };
  const sessionMock = {
    isAuthenticated: false
  };
  const eventMock = {
    id: 'abcd',
    causeMessage: 'Merged by batman',
    commit: {
      message: 'Merge pull request #2 from batcave/batmobile',
      author: {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'http://example.com/u/batman/avatar',
        url: 'http://example.com/u/batman'
      },
      url: 'http://example.com/batcave/batmobile/commit/abcdef1029384'
    },
    truncatedMessage: 'Merge it',
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'batman',
      name: 'Bruce W',
      avatar: 'http://example.com/u/batman/avatar',
      url: 'http://example.com/u/batman'
    },
    pipelineId: '12345',
    sha: 'abcdef1029384',
    truncatedSha: 'abcdef',
    type: 'pipeline',
    workflow: ['main', 'publish']
  };

  this.set('buildMock', buildMock);
  this.set('jobMock', jobMock);
  this.set('pipelineMock', pipelineMock);
  this.set('sessionMock', sessionMock);
  this.set('eventMock', eventMock);
  this.render(hbs`{{build-banner
    build=buildMock
    job=jobMock
    pipeline=pipelineMock
    session=sessionMock
    event=eventMock
  }}`);

  assert.equal($('h1').text().trim(), 'PR-671');
  assert.equal($('.line2 a').prop('href'),
    'http://example.com/batcave/batmobile/commit/abcdef1029384');
  assert.equal($('.line2 a').text().trim(), '#abcdef');
  assert.equal($('.message').text().trim(),
    'Merge it');
  assert.equal($('.message').prop('title'),
    'Merge pull request #2 from batcave/batmobile');
  assert.equal($('.container').text().trim(), 'node:6');
  assert.equal($('.duration').text().trim(), '5 seconds');
  assert.equal($('button').length, 0);
});

test('it does not render a restart button for non-PR jobs when authenticated', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = Ember.Object.create({
    status: 'ABORTED',
    cause: 'monkeys with typewriters',
    sha: 'abcd1234567890',
    buildDuration: '5 seconds'
  });
  const jobMock = Ember.Object.create({
    name: 'main'
  });
  const pipelineMock = Ember.Object.create({
    appId: 'foo:bar',
    branch: 'master',
    hubUrl: 'http://github.com/foo/bar'
  });
  const sessionMock = Ember.Object.create({
    isAuthenticated: true
  });

  this.set('buildMock', buildMock);
  this.set('jobMock', jobMock);
  this.set('pipelineMock', pipelineMock);
  this.set('sessionMock', sessionMock);
  this.render(hbs`{{build-banner
    build=buildMock
    job=jobMock
    pipeline=pipelineMock
    session=sessionMock
  }}`);

  assert.equal($('button').length, 0);
});

test('it renders a restart button for PR jobs when authenticated', function (assert) {
  assert.expect(2);
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = Ember.Object.create({
    status: 'ABORTED',
    cause: 'monkeys with typewriters',
    sha: 'abcd1234567890',
    buildDuration: '5 seconds'
  });
  const jobMock = Ember.Object.create({
    name: 'PR-1234'
  });
  const pipelineMock = Ember.Object.create({
    appId: 'foo:bar',
    branch: 'master',
    hubUrl: 'http://github.com/foo/bar'
  });
  const sessionMock = Ember.Object.create({
    isAuthenticated: true
  });
  const startAction = () => {
    assert.ok(true);
  };

  this.set('buildMock', buildMock);
  this.set('jobMock', jobMock);
  this.set('pipelineMock', pipelineMock);
  this.set('sessionMock', sessionMock);
  this.set('externalStart', startAction);
  this.render(hbs`{{build-banner
    build=buildMock
    job=jobMock
    pipeline=pipelineMock
    session=sessionMock
    onStart=(action externalStart)
  }}`);

  assert.equal($('button').text().trim(), 'Restart');
  $('button').click();
});

test('it renders a stop button for job when authenticated', function (assert) {
  assert.expect(2);
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const buildMock = Ember.Object.create({
    status: 'RUNNING',
    cause: 'monkeys with typewriters',
    sha: 'abcd1234567890',
    buildDuration: '5 seconds'
  });
  const jobMock = Ember.Object.create({
    name: 'main'
  });
  const pipelineMock = Ember.Object.create({
    appId: 'foo:bar',
    branch: 'master',
    hubUrl: 'http://github.com/foo/bar'
  });
  const sessionMock = Ember.Object.create({
    isAuthenticated: true
  });
  const stopAction = () => {
    assert.ok(true);
  };

  this.set('buildMock', buildMock);
  this.set('jobMock', jobMock);
  this.set('pipelineMock', pipelineMock);
  this.set('sessionMock', sessionMock);
  this.set('externalStop', stopAction);
  this.render(hbs`{{build-banner
    build=buildMock
    job=jobMock
    pipeline=pipelineMock
    session=sessionMock
    onStop=(action externalStop)
  }}`);

  assert.equal($('button').text().trim(), 'Stop');
  $('button').click();
});
