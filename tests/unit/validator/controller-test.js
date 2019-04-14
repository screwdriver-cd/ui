import { run } from '@ember/runloop';
import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import sinon from 'sinon';

const serviceMock = {
  isTemplate: sinon.stub(),
  getValidationResults: sinon.stub()
};

const validatorStub = Service.extend(serviceMock);

const EXAMPLE_TEMPLATE = `
name: batman/batmobile
version: 2.0.1
description: Big noisy car
maintainer: batman@batcave.com
config:
  image: batman:4
  steps:
    - forgreatjustice: ba.sh`;

const EXAMPLE_CONFIG = `
jobs:
  main:
    image: batman:4
    steps:
      - forgreatjustice: ba.sh
`;

module('Unit | Controller | validator', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:validator'],
  hooks.beforeEach(function() {
    this.owner.register('service:validator', validatorStub);
    this.validator = this.owner.lookup('service:validator');

    serviceMock.isTemplate.reset();
    serviceMock.getValidationResults.reset();
  });

  test('it handles template yaml', function (assert) {
    const controller = this.owner.lookup('controller:validator');
    const expectedResult = { foo: 'bar' };

    serviceMock.isTemplate.withArgs(EXAMPLE_TEMPLATE).returns(true);
    serviceMock.getValidationResults.withArgs(EXAMPLE_TEMPLATE).returns(
      resolve(expectedResult)
    );

    // wrap the test in the run loop because we are dealing with async functions
    return run(() => {
      controller.set('yaml', EXAMPLE_TEMPLATE);

      return settled().then(() => {
        assert.equal(controller.get('isTemplate'), true);
        assert.deepEqual(controller.get('results'), expectedResult);
      });
    });
  });

  test('it handles screwdriver yaml', function (assert) {
    const controller = this.owner.lookup('controller:validator');
    const expectedResult = { foo: 'bar' };

    serviceMock.isTemplate.withArgs(EXAMPLE_CONFIG).returns(false);
    serviceMock.getValidationResults.withArgs(EXAMPLE_CONFIG).returns(
      resolve(expectedResult)
    );

    // wrap the test in the run loop because we are dealing with async functions
    return run(() => {
      controller.set('yaml', EXAMPLE_CONFIG);

      return settled().then(() => {
        assert.equal(controller.get('isTemplate'), false);
        assert.deepEqual(controller.get('results'), expectedResult);
      });
    });
  });

  test('it handles clearing yaml', function (assert) {
    const controller = this.owner.lookup('controller:validator');
    const expectedResult = { foo: 'bar' };

    serviceMock.isTemplate.withArgs(EXAMPLE_CONFIG).returns(false);
    serviceMock.getValidationResults.withArgs(EXAMPLE_CONFIG).returns(
      resolve(expectedResult)
    );

    // wrap the test in the run loop because we are dealing with async functions
    return run(() => {
      controller.set('yaml', EXAMPLE_CONFIG);

      return settled().then(() => {
        assert.equal(controller.get('isTemplate'), false);
        assert.deepEqual(controller.get('results'), expectedResult);
        controller.set('yaml', '');

        assert.equal(controller.get('results'), '');
      });
    });
  });
});
