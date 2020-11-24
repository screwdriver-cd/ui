# Screwdriver UI

[![Version][version-image]][version-url] ![Downloads][downloads-image] [![Build Status][build-image]][build-url] [![Open Issues][issues-image]][issues-url] ![License][license-image]

This README outlines the details of collaborating on this Ember application.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) >= v6.0.0 (with NPM)
* [Ember CLI](https://ember-cli.com/)
* [Google Chrome](https://google.com/chrome/) (for testing)

## Installation
```bash
$ git clone git@github.com:screwdriver-cd/ui.git
$ cd ui/          # change into the new directory
$ npm install
```

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Local config

Put local app settings at `config/local.js` Settings at this file will be merged 
with environment settings at  `config/environment.js`

```
'use strict';

const SDAPI_HOSTNAME = 'http://1.142.1.106:9001';
const SDSTORE_HOSTNAME = 'http://1.142.1.106:9002';

const APP_CONFIG = {
  SDAPI_HOSTNAME,
  SDSTORE_HOSTNAME
};

module.exports = APP_CONFIG;
```

### Run app

* `ember serve`

Visit your app at [http://localhost:4200](http://localhost:4200).

### Running Tests

* `ember test`
* `ember test --server`

To run a single ember test:
* `ember t -s -m '<TEST_NAME>'`   // e.g. ember t -s -m 'Integration | Component | pipeline options'

To see coverage results, run:
* `open coverage/lcov-report/index.html`

### Linting

* `npm run lint:hbs`
* `npm run lint:js`
* `npm run lint:js -- --fix`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [ember-cli](https://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

## License
Code licensed under the BSD 3-Clause license. See LICENSE file for terms.

[version-image]: https://img.shields.io/github/tag/screwdriver-cd/ui.svg
[version-url]: https://github.com/screwdriver-cd/ui/releases/
[downloads-image]: https://img.shields.io/docker/pulls/screwdrivercd/ui.svg
[license-image]: https://img.shields.io/github/license/screwdriver-cd/ui.svg
[issues-image]: https://img.shields.io/github/issues/screwdriver-cd/screwdriver.svg
[issues-url]: https://github.com/screwdriver-cd/screwdriver/issues
[build-image]: https://cd.screwdriver.cd/pipelines/7/badge
[build-url]: https://cd.screwdriver.cd/pipelines/7/
