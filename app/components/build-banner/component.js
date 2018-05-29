import { computed, get } from '@ember/object';
import { alias, match, sort, reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Component from '@ember/component';


export default Component.extend({
  classNames: ['build-banner', 'row'],
  classNameBindings: ['buildStatus'],
  coverage: service(),
  isPR: match('jobName', /^PR-/),
  testArr: ['a','b','c','d','e','6','z'],
  coverageStep: computed('buildSteps', {
    get() {
      const buildSteps = this.get('buildSteps');
      const coverageStep = buildSteps.find(item =>
        /^sd-teardown-screwdriver-coverage/.test(item.name));

      return coverageStep;
    }
  }),


  coverageStepEndTime: alias('coverageStep.endTime'),

  coverageStepStartTime: alias('coverageStep.startTime'),

  prNumber: computed('event.pr.url', {
    get() {
      let url = this.get('event.pr.url');

      return url.split('/').pop();
    }
  }),

  shortenedPrShas: computed('prEvents', {
    get() {

      return this.get('prEvents').then((result) => {
        let shortenedPrs = [];

        console.log('HELLO WORLD')
        console.log(result)

        result.map((pr) => {
          shortenedPrs.push(pr.sha.substr(0,6));
        })
        console.log(shortenedPrs)
        return shortenedPrs;
      });
      
    }
  }),

  buildAction: computed('buildStatus', {
    get() {
      const status = this.get('buildStatus');

      if (status === 'RUNNING' || status === 'QUEUED') {
        return 'Stop';
      }

      return 'Restart';
    }
  }),

  isWaiting: computed('buildStatus', {
    get() {
      return this.get('buildStatus') === 'QUEUED';
    }
  }),

  hasButton: computed('buildAction', 'jobName', {
    get() {
      if (this.get('buildAction') === 'Stop') {
        return true;
      }

      if (/^PR-/.test(this.get('jobName'))) {
        return true;
      }

      return false;
    }
  }),

  coverageInfoCompute() {
    const coverageStepEndTime = this.get('coverageStepEndTime');
    const coverageStepStartTime = this.get('coverageStepStartTime');

    if (!coverageStepEndTime) {
      this.set('coverageInfo', {
        projectUrl: '#',
        coverage: 'N/A'
      });

      return;
    }

    const config = {
      buildId: this.get('buildId'),
      jobId: this.get('jobId'),
      startTime: coverageStepStartTime,
      endTime: coverageStepEndTime
    };

    this.get('coverage').getCoverageInfo(config)
      .then((data) => {
        this.set('coverageInfo', data);
        this.set('coverageInfoSet', true);
      });
  },

  init() {
    this._super(...arguments);

    this.set('coverageInfoSet', false);

    this.coverageInfoCompute();
  },

  willRender() {
    this._super(...arguments);

    const status = this.get('buildStatus');

    if (status === 'QUEUED' || status === 'RUNNING') {
      this.get('reloadBuild')();
    }

    if (this.get('coverageStepEndTime') && !this.get('coverageInfoSet')) {
      this.coverageInfoCompute();
    }
  },

  eventsSorted: sort('events.[]',
    (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10)),

  actions: {

    changeCurPr(pr){
      console.log(pr)
      const prs = this.get('prEvents')._result;
      console.log(prs);
      this.set('event.truncatedSha',pr)
      let changeBuild = this.get('changeBuild');
      for(let i = 0; i < prs.length; i++) {
        if(pr == prs[i].sha.substr(0,6)) {
          this.set('event.commit.url', prs[i].commit.url)
          changeBuild( prs[i].pipelineId, prs[i].id);
          break;
        }
      }
    },

    test() {
      const temp = this.get('shortenedPrShas')
      console.log(temp)
      
    },

    buildButtonClick() {
      if (this.get('buildAction') === 'Stop') {
        this.get('onStop')();
      } else {
        this.get('onStart')();
      }
    }
  }
});
