import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, click, findAll, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline secret settings', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const testSecret = EmberObject.create({
      name: 'TEST_SECRET',
      pipelineId: 123245,
      value: 'banana',
      allowInPR: false
    });

    this.set('mockSecrets', [testSecret]);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set('mockPipeline', testPipeline);

    await render(hbs`{{pipeline-secret-settings secrets=mockSecrets pipeline=mockPipeline}}`);

    assert.equal(find('p').textContent.trim(),
      'User secrets must also be added to the Screwdriver YAML.');

    // the table is present
    assert.equal(findAll('table').length, 1);
    assert.equal(findAll('tbody tr').length, 1);
    assert.equal(findAll('tfoot tr').length, 1);

    // eye-icons are present and have fa-eye class as default
    assert.ok(find('tbody i').classList.contains('fa-eye'));
    assert.ok(find('tfoot i').classList.contains('fa-eye'));

    // the type of input is a password as default
    assert.equal(find('tbody .pass input').getAttribute('type'), 'password');
    assert.equal(find('tfoot .pass input').getAttribute('type'), 'password');
  });

  test('it updates the add button properly', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('mockPipeline', { id: 'abcd' });
    await render(hbs`{{pipeline-secret-settings pipeline=mockPipeline}}`);

    // starts disabled
    assert.ok(find('tfoot button').disabled);

    // disabled when no value
    await fillIn('.key input', 'SECRET_KEY').keyup();
    assert.ok(find('tfoot button').disabled);

    // disabled when no key
    await fillIn('.key input', '').keyup();
    await fillIn('.pass input', 'SECRET_VAL').keyup();
    assert.ok(find('tfoot button').disabled);

    // enabled when both present
    await fillIn('.key input', 'SECRET_KEY').keyup();
    assert.ok(!find('tfoot button').disabled);

    // disabled again when no key
    await fillIn('.key input', '').keyup();
    assert.ok(find('tfoot button').disabled);
  });

  test('it calls action to create secret', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('mockPipeline', { id: 'abcd' });
    this.set('externalAction', (name, value, id) => {
      assert.equal(name, 'SECRET_KEY');
      assert.equal(value, 'SECRET_VAL');
      assert.equal(id, 'abcd');
    });

    // eslint-disable-next-line max-len
    await render(hbs`{{pipeline-secret-settings pipeline=mockPipeline onCreateSecret=(action externalAction)}}`);

    await fillIn('.key input', 'SECRET_KEY').keyup();
    await fillIn('.pass input', 'SECRET_VAL').keyup();
    await click('tfoot button');

    // and clears the new secret form elements
    assert.equal(find('.key input').value, '');
    assert.equal(find('.pass input').value, '');
    assert.ok(find('tfoot button').disabled, 'not disabled');
  });

  test('it displays an error', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('mockPipeline', { id: 'abcd' });
    this.set('externalAction', () => {
      assert.fail('should not get here');
    });

    // eslint-disable-next-line max-len
    await render(hbs`{{pipeline-secret-settings pipeline=mockPipeline onCreateSecret=(action externalAction)}}`);

    await fillIn('.key input', '0banana').keyup();
    await fillIn('.pass input', '0value').keyup();
    await click('tfoot button');

    // and clears the new secret form elements
    assert.equal(find('.alert > span').textContent.trim(),
      'Secret keys can only consist of numbers, uppercase letters and underscores, ' +
      'and cannot begin with a number.');
  });

  test('it sorts secrets by name alphabetically', async function(assert) {
    const testSecret1 = EmberObject.create({
      name: 'FOO',
      pipelineId: 123245,
      value: 'banana',
      allowInPR: false
    });

    const testSecret2 = EmberObject.create({
      name: 'BAR',
      pipelineId: 123245,
      value: 'banana',
      allowInPR: false
    });

    const testSecret3 = EmberObject.create({
      name: 'ZOO',
      pipelineId: 123245,
      value: 'banana',
      allowInPR: false
    });

    this.set('mockSecrets', [testSecret1, testSecret2, testSecret3]);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set('mockPipeline', testPipeline);
    await render(hbs`{{pipeline-secret-settings secrets=mockSecrets pipeline=mockPipeline}}`);

    // secrets are sorted by name
    assert.equal(find('tbody tr:first-child td:first-child').textContent.trim(), 'BAR');
    assert.equal(find('tbody tr:nth-child(2) td:first-child').textContent.trim(), 'FOO');
    assert.equal(find('tbody tr:nth-child(3) td:first-child').textContent.trim(), 'ZOO');
  });

  test('it renders differently for a child pipeline', async function(assert) {
    const testSecret = EmberObject.create({
      name: 'FOO',
      pipelineId: 123245,
      value: 'banana',
      allowInPR: false
    });

    this.set('mockSecrets', [testSecret]);

    const testPipeline = EmberObject.create({
      id: '123',
      configPipelineId: '123245'
    });

    this.set('mockPipeline', testPipeline);
    await render(hbs`{{pipeline-secret-settings secrets=mockSecrets pipeline=mockPipeline}}`);

    assert.equal(find('p').textContent.trim().replace(/\+s/g, ' '),
      'Secrets are inherited from the parent pipeline. ' +
      'You may override a secret or revert it back to its original value.');

    // Secrets are rendered but footer is not
    assert.equal(findAll('table').length, 1);
    assert.equal(findAll('tbody tr').length, 1);
    assert.equal(findAll('tfoot tr').length, 0);
  });

  test('it toggles eye-icon and input type', async function(assert) {
    const testSecret = EmberObject.create({
      name: 'TEST_SECRET',
      pipelineId: 123245,
      value: 'banana',
      allowInPR: false
    });

    this.set('mockSecrets', [testSecret]);

    const testPipeline = EmberObject.create({
      id: '123245'
    });

    this.set('mockPipeline', testPipeline);

    await render(hbs`{{pipeline-secret-settings secrets=mockSecrets pipeline=mockPipeline}}`);

    await click('tbody i');
    await click('tfoot i');

    assert.ok(find('tbody i').classList.contains('fa-eye-slash'));
    assert.equal(find('tbody .pass input').getAttribute('type'), 'text');
    assert.ok(find('tfoot i').classList.contains('fa-eye-slash'));
    assert.equal(find('tfoot .pass input').getAttribute('type'), 'text');

    await click('tbody i');
    await click('tfoot i');

    assert.ok(find('tbody i').classList.contains('fa-eye'));
    assert.equal(find('tbody .pass input').getAttribute('type'), 'password');
    assert.ok(find('tfoot i').classList.contains('fa-eye'));
    assert.equal(find('tfoot .pass input').getAttribute('type'), 'password');
  });
});
