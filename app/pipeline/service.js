import classic from 'ember-classic-decorator';
import Service from '@ember/service';

@classic
export default class PipelineService extends Service {
  buildsLink = `pipeline.events`;

  setBuildsLink(buildsLink) {
    this.set('buildsLink', buildsLink);
  }
}
