import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('workflow-tooltip', 'Integration | Component | workflow tooltip', {
  integration: true
});

test('it renders', function (assert) {
  this.render(hbs`{{workflow-tooltip}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#workflow-tooltip}}
      template block text
    {{/workflow-tooltip}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});

test('it renders build link', function (assert) {
  const data = {
    job: {
      buildId: 1234,
      name: 'batmobile'
    }
  };

  this.set('data', data);

  this.render(hbs`{{workflow-tooltip tooltipData=data}}`);

  assert.equal(this.$('.content a').length, 1);
  assert.equal(this.$().text().trim(), 'Go to build details');
});

test('it renders restart link', function (assert) {
  const data = {
    job: {
      buildId: 1234,
      name: 'batmobile'
    }
  };

  this.set('data', data);
  this.set('confirmStartBuild', () => {});

  this.render(hbs`{{
    workflow-tooltip
    tooltipData=data
    displayRestartButton=true
    confirmStartBuild="confirmStartBuild"
  }}`);

  assert.equal(this.$('.content a').length, 2);
  assert.equal(this.$('a').text().trim(), 'Go to build detailsStart pipeline from here');
});

test('it should update position and hidden status', function (assert) {
  this.set('show', true);
  this.set('pos', 'left');

  this.render(hbs`{{
    workflow-tooltip
    showTooltip=show
    showTooltipPosition=pos
  }}`);

  assert.ok(this.$('.workflow-tooltip').hasClass('show-tooltip'));
  assert.ok(this.$('.workflow-tooltip').hasClass('left'));

  this.set('show', false);
  this.set('pos', 'center');

  assert.notOk(this.$('.workflow-tooltip').hasClass('show-tooltip'));
  assert.notOk(this.$('.workflow-tooltip').hasClass('left'));
});
