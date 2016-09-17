import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('pipeline-workflow', 'Integration | Component | pipeline workflow', {
  integration: true,
  setup() {
    const StubInstance = Ember.Object.extend({
      didCreateRootView() {}
    });

    this.registry.register('-application-instance:main', StubInstance);
    const router = this.container.lookup('router:main');

    router.startRouting(true);
  }
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  // eslint-disable-next-line new-cap
  const builds = Ember.A([
    Ember.Object.create({ id: '123', status: 'SUCCESS' })
  ]);

  const jobs = [
    Ember.Object.create({ id: 'abcd', name: 'hello', builds })
  ];

  this.set('jobsMock', jobs);

  this.render(hbs`{{pipeline-workflow jobs=jobsMock}}`);

  assert.equal(this.$('a').text().trim(), 'hello');
  assert.equal(this.$('li').attr('style'), 'width:100%');
  assert.equal(this.$('li').attr('class'), 'SUCCESS');
  assert.equal(this.$('a').attr('href'), '/builds/123');
});
