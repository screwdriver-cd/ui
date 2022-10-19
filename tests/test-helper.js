import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
import setupSinon from 'ember-sinon-qunit';
import Application from 'screwdriver-ui/app';
import config from 'screwdriver-ui/config/environment';

setApplication(Application.create(config.APP));

setupSinon();

start();
