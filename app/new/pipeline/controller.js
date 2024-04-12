import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action, setProperties, get } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
import timeRange from 'screwdriver-ui/utils/time-range';

export default class NewPipelineController extends Controller {
  @service store;

  @service template;

  @service session;

  @service router;
}
