import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Service | tokens', function (hooks) {
  setupTest(hooks);

  let shuttle;

  let tokensService;

  hooks.beforeEach(function () {
    tokensService = this.owner.lookup('service:tokens');
    shuttle = this.owner.lookup('service:shuttle');

    tokensService.clear();
  });

  test('it exists', function (assert) {
    assert.ok(tokensService);
  });

  test('fetchTokens fetches tokens', async function (assert) {
    sinon
      .stub(shuttle, 'fetchFromApi')
      .resolves([{ name: 'TOKEN1' }, { name: 'TOKEN2' }]);

    await tokensService.fetchTokens();

    assert.equal(tokensService.tokens.length, 2);
    assert.equal(tokensService.tokenNames.length, 2);
  });

  test('fetchTokens returns error message', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

    const errorMessage = await tokensService.fetchTokens();

    assert.equal(tokensService.tokens.length, 0);
    assert.equal(tokensService.tokenNames.length, 0);
    assert.equal(errorMessage, 'error');
  });

  test('addToken adds a token correctly', async function (assert) {
    const tokenName = 'first';

    tokensService.tokens = [{ name: tokenName }];
    tokensService.tokenNames = [tokenName];

    tokensService.addToken({ name: 'new' });

    assert.equal(tokensService.tokens.length, 2);
    assert.equal(tokensService.tokenNames.length, 2);
    assert.equal(tokensService.tokens[0].name, 'new');
  });

  test('updateToken updates a token correctly', async function (assert) {
    const updatedToken = { id: 2, name: 'CHANGED', description: 'updated' };

    sinon.stub(shuttle, 'fetchFromApi').resolves([
      { id: 1, name: 'TOKEN1' },
      { id: 2, name: 'TOKEN2' }
    ]);

    await tokensService.fetchTokens();
    tokensService.updateToken(updatedToken);

    assert.equal(tokensService.tokens.length, 2);
    assert.equal(tokensService.tokenNames.length, 2);
    assert.equal(tokensService.tokens[1].name, updatedToken.name);
    assert.equal(tokensService.tokens[1].description, updatedToken.description);
  });

  test('deleteToken deletes a token correctly', async function (assert) {
    const deletedToken = { id: 1, name: 'TOKEN1' };

    sinon.stub(shuttle, 'fetchFromApi').resolves([
      { id: 0, name: 'TOKEN0' },
      { id: 1, name: 'TOKEN1' },
      { id: 2, name: 'TOKEN2' }
    ]);

    await tokensService.fetchTokens();
    tokensService.deleteToken(deletedToken);

    assert.equal(tokensService.tokens.length, 2);
    assert.equal(tokensService.tokenNames.length, 2);
    assert.equal(tokensService.tokens[1].name, 'TOKEN2');
    assert.equal(tokensService.tokenNames[1], 'TOKEN2');
  });
});
