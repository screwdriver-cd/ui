import Service from '@ember/service';

export default class SelectedPrShaService extends Service {
  sha = '';

  setSha(sha) {
    this.sha = sha;
  }

  getSha() {
    return this.sha;
  }

  isEventSelected(event) {
    return this.sha.startsWith(event.sha);
  }
}
