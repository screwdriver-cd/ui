import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const COMMANDS = [
  { version: '3.0.0', tag: 'latest stable' },
  { version: '2.0.0', tag: 'meeseeks' },
  { version: '1.0.0' }
];

moduleForComponent('command-versions', 'Integration | Component | command versions', {
  integration: true
});

test('it renders', function (assert) {
  this.set('mock', COMMANDS);
  this.on('mockAction', function () {});

  this.render(hbs`{{command-versions commands=mock changeVersion=(action "mockAction")}}`);

  assert.equal(this.$('h4').text().trim(), 'Versions:');
  assert.equal(this.$('ul li').text().trim(), '3.0.0 - latest stable2.0.0 - meeseeks1.0.0');
});

test('it handles clicks on versions', function (assert) {
  assert.expect(3);

  this.set('mock', COMMANDS);
  this.on('mockAction', function (ver) {
    assert.equal(ver, '1.0.0');
  });

  this.render(hbs`{{command-versions commands=mock changeVersion=(action "mockAction")}}`);

  assert.equal(this.$('h4').text().trim(), 'Versions:');
  assert.equal(this.$('ul li').text().trim(), '3.0.0 - latest stable2.0.0 - meeseeks1.0.0');
  this.$('ul li:last-child span').click();
});
