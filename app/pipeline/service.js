import Service from '@ember/service';

export default Service.extend({
  buildsLink: `pipeline.events`,

  setBuildsLink(buildsLink) {
    this.set('buildsLink', buildsLink);
  }
});
