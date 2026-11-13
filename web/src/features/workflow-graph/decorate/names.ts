export const STAGE_SETUP_PATTERN = /^stage@([\w-]+)(?::setup)$/;
export const STAGE_TEARDOWN_PATTERN = /^stage@([\w-]+)(?::teardown)$/;
export const STAGE_COLLAPSED_JOB_PATTERN = /^stage@([\w-]+) jobs.*$/;

const EDGE_SRC_BRANCH = /^~(pr|commit):\/(.+)\/$/;
const TRIGGER_BRANCH = /^~(pr|commit):(.+)$/;

export const isStageSetupJob = (name: string): boolean => STAGE_SETUP_PATTERN.test(name);
export const isStageTeardownJob = (name: string): boolean => STAGE_TEARDOWN_PATTERN.test(name);
export const isStageCollapsedJob = (name: string): boolean => STAGE_COLLAPSED_JOB_PATTERN.test(name);

/** `~pr`, `~commit`, `~pr:branch`, `~commit:/regex/` */
export const isScmTrigger = (name: string): boolean =>
  name === '~commit' || name === '~pr' || /^~(pr|commit):/.test(name);

/** `sd@123:job` or `~sd@123:job` */
export const isExternalNode = (name: string): boolean => /^~?sd@\d+:/.test(name);

/** `~sd-<job>-triggers` downstream trigger summary nodes. */
export const isDownstreamTriggerNode = (name: string): boolean => /^~sd-[\w-]+-triggers$/.test(name);

/**
 * Whether trigger node `name` is what started the event (`start`).
 * Handles `~commit`/`~pr` exactly and branch-specific `~commit:/re/` against `~commit:branch`.
 */
export function isTrigger(name: string, start: string): boolean {
  if (name === start && /^~/.test(name)) {
    return true;
  }

  const edgeSrcBranch = name.match(EDGE_SRC_BRANCH);

  if (edgeSrcBranch) {
    const triggerBranch = start.match(TRIGGER_BRANCH);

    if (triggerBranch && triggerBranch[1] === edgeSrcBranch[1]) {
      try {
        return new RegExp(edgeSrcBranch[2] as string).test(triggerBranch[2] as string);
      } catch {
        return false;
      }
    }
  }

  return false;
}
