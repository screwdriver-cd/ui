import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default class TemplatesPipelineDetailIndexRoute extends Route.extend(
  AuthenticatedRouteMixin
) {}
