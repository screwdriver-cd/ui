import EmberObject from '@ember/object';
import hbs from 'htmlbars-inline-precompile';
import { moduleForComponent } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';

const eventMock = EmberObject.create({
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
  workflow: ['main', 'publish'],
  builds: ['build1', 'build2']
});

const jobMock = [
  EmberObject.create({
    id: '1',
    name: 'main'
  }), EmberObject.create({
    id: '2',
    name: 'publish'
  })
];

moduleForComponent('build-banner', 'Integration | Component | build banner', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(9);
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('reloadCb', () => {
    assert.ok(true);
  });

  this.set('eventMock', eventMock);
  this.set('jobMock', jobMock);
  this.render(hbs`{{build-banner
    buildContainer="node:6"
    buildStatus="RUNNING"
    duration="5 seconds"
    event=eventMock
    isAuthenticated=false
    jobName="PR-671"
    reloadBuild=(action reloadCb)
    jobs=jobMock
    eventBuilds=eventMock.builds
  }}`);

  assert.equal($('h1').text().trim(), 'PR-671');
  assert.equal($('.commit a').prop('href'),
    'http://example.com/batcave/batmobile/commit/abcdef1029384');
  assert.equal($('.commit a').text().trim(), '#abcdef');
  assert.equal($('.message').text().trim(),
    'Merge it');
  assert.equal($('.message').prop('title'),
    'Merge pull request #2 from batcave/batmobile');
  assert.equal($('.event .col-xs-4:nth-child(2)').text().trim(), 'node:6');
  assert.equal($('.event .col-xs-4:nth-child(3)').text().trim(), '5 seconds');
  assert.equal($('button').length, 0);
});

test('it does not render a restart button for main job when authenticated', function (assert) {
  assert.expect(2);
  const reloadBuildSpy = this.spy();

  this.set('reloadCb', reloadBuildSpy);
  this.set('eventMock', eventMock);
  this.set('jobMock', jobMock);
  this.render(hbs`{{build-banner
    buildContainer="node:6"
    buildStatus="ABORTED"
    duration="5 seconds"
    event=eventMock
    isAuthenticated=true
    jobName="main"
    reloadBuild=(action reloadCb)
    jobs=jobMock
    eventBuilds=eventMock.builds
  }}`);

  assert.equal(this.$('button').length, 0);
  assert.notOk(reloadBuildSpy.called);
});

test('it does not render a restart button for publish job when authenticated', function (assert) {
  assert.expect(2);

  const reloadBuildSpy = this.spy();

  this.set('reloadCb', reloadBuildSpy);
  this.set('eventMock', eventMock);
  this.set('jobMock', jobMock);
  this.render(hbs`{{build-banner
    buildContainer="node:6"
    buildStatus="ABORTED"
    duration="5 seconds"
    event=eventMock
    isAuthenticated=true
    jobName="publish"
    reloadBuild=(action reloadCb)
    jobs=jobMock
    eventBuilds=eventMock.builds
  }}`);

  assert.equal(this.$('button').length, 0);
  assert.notOk(reloadBuildSpy.called);
});

test('it renders a restart button for PR jobs when authenticated', function (assert) {
  assert.expect(3);

  const reloadBuildSpy = this.spy();

  this.set('reloadCb', reloadBuildSpy);
  this.set('externalStart', () => {
    assert.ok(true);
  });
  this.set('eventMock', eventMock);
  this.set('jobMock', jobMock);

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    buildStatus="ABORTED"
    duration="5 seconds"
    event=eventMock
    isAuthenticated=true
    jobName="PR-671"
    reloadBuild=(action reloadCb)
    onStart=(action externalStart)
    jobs=jobMock
    eventBuilds=eventMock.builds
  }}`);

  assert.equal(this.$('button').text().trim(), 'Restart');
  assert.notOk(reloadBuildSpy.called);
  this.$('button').click();
});

test('it renders a stop button for job when authenticated', function (assert) {
  assert.expect(3);
  this.set('willRender', () => {
    assert.ok(true);
  });

  this.set('externalStop', () => {
    assert.ok(true);
  });
  this.set('eventMock', eventMock);
  this.set('jobMock', jobMock);
  this.render(hbs`{{build-banner
    buildContainer="node:6"
    buildStatus="RUNNING"
    duration="5 seconds"
    event=eventMock
    isAuthenticated=true
    jobName="main"
    reloadBuild=(action willRender)
    onStop=(action externalStop)
    jobs=jobMock
    eventBuilds=eventMock.builds
  }}`);

  assert.equal(this.$('button').text().trim(), 'Stop');
  this.$('button').click();
});
