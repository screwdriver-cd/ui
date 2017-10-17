import Controller from '@ember/controller';

export default Controller.extend({
  errorMessage: '',
  actions: {
    createSecret(name, value, pipelineId, allowInPR) {
      const newSecret = this.store.createRecord('secret', { name, value, pipelineId, allowInPR });

      return newSecret.save()
        .then((s) => {
          this.set('errorMessage', '');
          this.get('model.secrets').reload();

          return s;
        }, (err) => {
          this.set('errorMessage', err.errors[0].detail);
        });
    }
  }
});
