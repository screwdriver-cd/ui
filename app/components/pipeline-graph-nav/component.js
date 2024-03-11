import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';
import { getTimestamp } from '../../utils/timestamp-format';

export default Component.extend({
  session: service(),
  userSettings: service(),
  store: service(),
  isPR: computed('graphType', {
    get() {
      return this.graphType === 'pr';
    }
  }),
  prJobs: computed('selectedEventObj.prNum', 'prGroups', {
    get() {
      const prNum = this.get('selectedEventObj.prNum');

      return this.prGroups[prNum];
    }
  }),
  eventOptions: computed('lastSuccessful', 'mostRecent', 'isPR', {
    get() {
      const options = [
        { label: 'Most Recent', value: this.mostRecent },
        { label: 'Last Successful', value: this.lastSuccessful }
      ];

      return options;
    }
  }),
  showGraphNavRow: computed('selectedEventObj.type', 'isPR', {
    get() {
      const eventType = this.get('selectedEventObj.type');

      return !this.isPR || eventType === 'pr';
    }
  }),
  icon: computed('selectedEventObj.status', {
    get() {
      return statusIcon(this.get('selectedEventObj.status'));
    }
  }),
  startDate: computed('selectedEventObj.createTime', {
    get() {
      let startDate = 'n/a';

      startDate = getTimestamp(
        this.userSettings,
        this.get('selectedEventObj.createTime')
      );

      return startDate;
    }
  }),
  notificationReady: false,
  notificationEventId: null,
  buildNotify: observer('selectedEventObj.status', function buildNotify() {
    if (Notification.permission === 'granted' && this.allowNotification) {
      const eventStatus = this.get('selectedEventObj.status');

      if (['QUEUED', 'RUNNING'].includes(eventStatus)) {
        this.set('notificationEventId', this.get('selectedEventObj.id'));
        this.set('notificationReady', true);
      } else if (
        ['SUCCESS', 'FAILURE', 'ABORTED'].includes(eventStatus) &&
        this.notificationReady &&
        this.notificationEventId === this.get('selectedEventObj.id')
      ) {
        const screwdriverIconPath = '/assets/icons/android-chrome-144x144.png';
        const statusMap = {
          SUCCESS: '✅',
          FAILURE: '❌',
          ABORTED: '⛔'
        };

        const notificationIcon = statusMap[eventStatus];

        // eslint-disable-next-line no-new
        new Notification(`SD.cd ${this.pipeline.name}`, {
          body: `${notificationIcon} ${eventStatus}: Event ${this.get(
            'selectedEventObj.id'
          )}`,
          icon: screwdriverIconPath
        }).onclick = () => {
          window.focus();
        };
        this.set('notificationReady', false);
      } else {
        this.set('notificationReady', false);
      }
    }
  }),
  init() {
    this._super(...arguments);

    this.userSettings
      .getAllowNotification()
      .then(allowNotification => {
        this.set('allowNotification', allowNotification);
      })
      .catch(() => {
        this.set('allowNotification', false);
      });
  }
});
