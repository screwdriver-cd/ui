import Component from '@glimmer/component';

export default class PipelineJobsTableCellHistoryComponent extends Component {
  truncateSha(build) {
    return build.meta.build.sha.slice(0, 7);
  }
}
