import Component from '@glimmer/component';

export default class TokensTableCellExpiresComponent extends Component {
  get isExpiredToken() {
    const { expiresAt } = this.args.record;

    // No expiration
    if (!expiresAt) {
      return false;
    }

    const now = new Date();
    const exp = new Date(expiresAt);

    return exp < now;
  }
}
