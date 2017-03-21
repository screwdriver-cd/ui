import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import Ember from 'ember';

const parsedManifest = [{
  text: 'coverage',
  type: 'directory',
  children: [{
    text: 'coverage.json',
    type: 'file',
    a_attr: { href: 'http://foo.com/coverage.json' }
  }]
},
{
  text: 'test.txt',
  type: 'file',
  a_attr: { href: 'http://foo.com/test.txt' }
}
];

const artifactService = Ember.Service.extend({
  fetchManifest() {
    return Ember.RSVP.resolve(parsedManifest);
  }
});

moduleForComponent('artifact-tree', 'Integration | Component | artifact tree', {
  integration: true,

  beforeEach() {
    this.register('service:build-artifact', artifactService);
  }
});

test('it renders only title when build is running', function (assert) {
  this.render(hbs`
    {{artifact-tree
      buildStatus="RUNNING"
    }}
  `);

  assert.equal(this.$('.artifact-tree h4').text().trim(), 'Artifacts');
  assert.equal(this.$('.jstree-node').length, 0);
});

test('it renders with artifacts if build finished', function (assert) {
  this.render(hbs`
    {{artifact-tree
      buildStatus="SUCCESS"
    }}
  `);

  return wait().then(() => {
    // Check if it has two nodes and one of them is a leaf/file
    assert.equal(this.$('.jstree-leaf').length, 1);
    assert.equal(this.$('.jstree-node').length, 2);

    // Check if the href is correctly set and then click the link
    assert.equal(this.$('.jstree-leaf a').prop('href'), parsedManifest[1].a_attr.href);
    this.$('.jstree-leaf a').click();
  });
});
