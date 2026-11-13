import { describe, expect, it } from 'vitest';
import {
  isDownstreamTriggerNode,
  isExternalNode,
  isScmTrigger,
  isStageCollapsedJob,
  isStageSetupJob,
  isStageTeardownJob,
  isTrigger
} from './names';

// isTrigger's ~commit / branch-regex / invalid-regex cases live in decorate.test.ts.

describe('stage job names', () => {
  it('recognises setup and teardown jobs only by their exact suffix', () => {
    expect(isStageSetupJob('stage@integration:setup')).toBe(true);
    expect(isStageSetupJob('stage@blue-green_2:setup')).toBe(true);
    expect(isStageTeardownJob('stage@integration:teardown')).toBe(true);

    expect(isStageSetupJob('stage@integration:teardown')).toBe(false);
    expect(isStageTeardownJob('stage@integration:setup')).toBe(false);
    expect(isStageSetupJob('stage@integration:setup2')).toBe(false);
    expect(isStageSetupJob('xstage@integration:setup')).toBe(false);
    expect(isStageSetupJob('stage@:setup')).toBe(false);
    expect(isStageSetupJob('stage@a.b:setup')).toBe(false);
  });

  it('recognises the collapsed stage node name', () => {
    expect(isStageCollapsedJob('stage@production jobs (3)')).toBe(true);
    expect(isStageCollapsedJob('stage@production jobs')).toBe(true);
    expect(isStageCollapsedJob('stage@production')).toBe(false);
    expect(isStageCollapsedJob('stage@production:setup')).toBe(false);
  });
});

describe('trigger and external names', () => {
  it('treats ~pr, ~commit and their branch variants as SCM triggers, nothing else', () => {
    ['~pr', '~commit', '~pr:main', '~commit:/^release-.*$/'].forEach(name =>
      expect(isScmTrigger(name)).toBe(true)
    );
    [
      '~tag',
      '~release',
      '~prs',
      '~committed',
      'commit',
      '~sd@1:main',
      'main'
    ].forEach(name => expect(isScmTrigger(name)).toBe(false));
  });

  it('treats sd@<id>:job and ~sd@<id>:job as external, requiring a numeric id and a colon', () => {
    expect(isExternalNode('sd@123:main')).toBe(true);
    expect(isExternalNode('~sd@123:main')).toBe(true);
    expect(isExternalNode('sd@abc:main')).toBe(false);
    expect(isExternalNode('sd@123')).toBe(false);
    expect(isExternalNode('~~sd@123:main')).toBe(false);
    expect(isExternalNode('xsd@123:main')).toBe(false);
  });

  it('recognises downstream trigger summaries but not external triggers', () => {
    expect(isDownstreamTriggerNode('~sd-publish-triggers')).toBe(true);
    expect(isDownstreamTriggerNode('~sd-deploy_prod-triggers')).toBe(true);
    expect(isDownstreamTriggerNode('~sd@12:publish')).toBe(false);
    expect(isDownstreamTriggerNode('sd-publish-triggers')).toBe(false);
    expect(isDownstreamTriggerNode('~sd--triggers')).toBe(false);
  });
});

describe('isTrigger', () => {
  it('matches a plain start only for ~ nodes', () => {
    expect(isTrigger('~pr', '~pr')).toBe(true);
    expect(isTrigger('~sd@1:main', '~sd@1:main')).toBe(true);
    expect(isTrigger('main', 'main')).toBe(false);
    expect(isTrigger('~pr', '~commit')).toBe(false);
  });

  it('matches ~pr:/regex/ against a ~pr:branch start but not against a plain ~pr start', () => {
    expect(isTrigger('~pr:/^feat-/', '~pr:feat-x')).toBe(true);
    expect(isTrigger('~pr:/^feat-/', '~pr:fix-x')).toBe(false);
    expect(isTrigger('~pr:/^feat-/', '~pr')).toBe(false);
  });

  it('treats a literal branch name (no slashes) as an exact name, not a regex', () => {
    expect(isTrigger('~commit:main', '~commit:main')).toBe(true);
    expect(isTrigger('~commit:ma.n', '~commit:main')).toBe(false);
  });
});
