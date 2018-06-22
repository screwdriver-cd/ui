import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const TEMPLATES = [
  { version: '3.0.0', tag: 'latest stable' },
  { version: '2.0.0', tag: 'meeseeks' },
  { version: '1.0.0' }
];

moduleForComponent('template-versions', 'Integration | Component | template versions', {
  integration: true
});

test('it renders', function (assert) {
  this.set('mock', TEMPLATES);
  this.on('mockAction', function () {});

  this.render(hbs`{{template-versions templates=mock changeVersion=(action "mockAction")}}`);

  assert.equal(this.$('h4').text().trim(), 'Versions:');
  assert.equal(this.$('ul li').text().trim(), '3.0.0 - latest stable2.0.0 - meeseeks1.0.0');
});

test('it handles clicks on versions', function (assert) {
  assert.expect(3);

  this.set('mock', TEMPLATES);
  this.on('mockAction', function (ver) {
    assert.equal(ver, '1.0.0');
  });

  this.render(hbs`{{template-versions templates=mock changeVersion=(action "mockAction")}}`);

  assert.equal(this.$('h4').text().trim(), 'Versions:');
  assert.equal(this.$('ul li').text().trim(), '3.0.0 - latest stable2.0.0 - meeseeks1.0.0');
  this.$('ul li:last-child span').click();
});
