import ENV from 'screwdriver-ui/config/environment';

export default class DataReloader {
  shuttle;

  intervalId;

  responseCache;

  cacheKey;

  callbacks;

  queueNames;

  idSet;

  idCounts;

  pipelineId;

  constructor(shuttle, cacheKey = null) {
    this.shuttle = shuttle;
    this.cacheKey = cacheKey;
    this.responseCache = new Map();
    this.callbacks = new Map();
    this.queueNames = new Set();
    this.idSet = new Set();
    this.idCounts = new Map();
  }

  start() {
    this.stop();

    this.fetchData().then(() => {});

    this.intervalId = setInterval(
      () => this.fetchData().then(() => {}),
      ENV.APP.BUILD_RELOAD_TIMER
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;

      this.responseCache.clear();
      this.callbacks.clear();
      this.queueNames.clear();
      this.idSet.clear();
      this.idCounts.clear();
    }
  }

  setPipelineId(pipelineId) {
    this.pipelineId = pipelineId;
    this.idSet.clear();
    this.idSet.add(pipelineId);
  }

  async fetchData() {
    this.idSet.forEach(id => {
      this.fetchDataForId(id).then(response => {
        const key = this.cacheKey || id;

        this.responseCache.set(key, response);

        this.queueNames.forEach(queueName => {
          if (this.callbacks.get(queueName).has(id)) {
            this.callbacks.get(queueName).get(id)(response);
          }
        });
      });
    });
  }

  // eslint-disable-next-line no-empty-function, no-unused-vars
  async fetchDataForId(id) {}

  registerCallback(queueName, id, callback) {
    if (!this.callbacks.has(queueName)) {
      this.callbacks.set(queueName, new Map());
      this.queueNames.add(queueName);
    }

    this.callbacks.get(queueName).set(id, callback);

    if (!this.cacheKey) {
      this.idSet.add(id);
    }

    if (this.idCounts.has(id)) {
      this.idCounts.set(id, this.idCounts.get(id) + 1);
    } else {
      this.idCounts.set(id, 1);
    }

    const key = this.cacheKey || id;

    if (this.responseCache.has(key)) {
      callback(this.responseCache.get(key));
    } else {
      this.fetchDataForId(id).then(response => {
        this.responseCache.set(key, response);
        callback(response);
      });
    }
  }

  removeCallback(queueName, id) {
    if (this.callbacks.has(queueName)) {
      const deleted = this.callbacks.get(queueName).delete(id);

      if (deleted) {
        if (this.callbacks.get(queueName).size === 0) {
          this.callbacks.delete(queueName);
          this.queueNames.delete(queueName);
        }

        if (this.idCounts.get(id) === 1) {
          this.idCounts.delete(id);

          if (!this.cacheKey) {
            this.idSet.delete(id);
          }
        } else {
          this.idCounts.set(id, this.idCounts.get(id) - 1);
        }
      }
    }
  }
}
