/**
 * Pipeline and job parameters, ported from app/utils/pipeline/parameters.js.
 *
 * API shapes:
 *   pipeline.parameters           { name: 'v' | ['a', 'b'] | { value: 'v' | ['a','b'], description } }
 *   job.permutations[0].parameters  the same, per job
 *   event.meta.parameters         { name: { value } }  (pipeline level)
 *                                 { jobName: { name: { value } } }  (job level)
 */
import type { Job } from '../types';

export type ParamValue = string | string[];
export type RawParameters = Record<string, unknown>;
/** `{name: {value}}` */
export type ValueMap = Record<string, { value: string }>;
/** `{jobName: {name: {value}}}` */
export type JobValueMap = Record<string, ValueMap>;

export interface Parameter {
  name: string;
  /** The value currently selected (the event's value when restarting). */
  value: string;
  /** The pipeline/job definition's value: a string, or the list of allowed choices. */
  defaultValues: ParamValue;
  description: string;
}

export interface ParameterGroup {
  /** null for pipeline-level ("Shared") parameters. */
  jobName: string | null;
  title: string;
  parameters: Parameter[];
  isOpen: boolean;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A pipeline-level entry is `{value}`, a job-level one nests parameters one level deeper. */
export const isPipelineParameter = (v: unknown): boolean =>
  isObject(v) && v.value !== undefined;

export function extractEventParameters(parameters: RawParameters | undefined) {
  const pipelineParameters: RawParameters = {};
  const jobParameters: RawParameters = {};

  Object.entries(parameters ?? {}).forEach(([name, v]) => {
    (isPipelineParameter(v) ? pipelineParameters : jobParameters)[name] = v;
  });

  return { pipelineParameters, jobParameters };
}

/** `job name -> that job's first permutation's parameter definitions` */
export function extractJobParameters(
  jobs: Array<Pick<Job, 'name' | 'permutations'>>
): RawParameters {
  const out: RawParameters = {};

  jobs.forEach(job => {
    const parameters = job.permutations?.[0]?.parameters;

    if (parameters) {
      out[job.name] = parameters;
    }
  });

  return out;
}

const first = (v: unknown): string => {
  if (Array.isArray(v)) {
    return v.length ? String(v[0]) : '';
  }
  if (isObject(v) && v.value !== undefined && v.value !== '') {
    return first(v.value);
  }

  return v === undefined || v === null || isObject(v) ? '' : String(v);
};

/** Definitions -> `{name: {value}}` where an array of choices defaults to its first entry. */
export function extractDefaultParameters(
  parameters: RawParameters | undefined
): ValueMap {
  const out: ValueMap = {};

  Object.entries(parameters ?? {}).forEach(([name, parameter]) => {
    out[name] = { value: first(parameter) };
  });

  return out;
}

/** Same for every job: `{jobName: {name: {value}}}`, omitting jobs without parameters. */
export function extractDefaultJobParameters(
  jobs: Array<Pick<Job, 'name' | 'permutations'>>
): JobValueMap {
  const out: JobValueMap = {};

  jobs.forEach(job => {
    const defaults = extractDefaultParameters(
      job.permutations?.[0]?.parameters
    );

    if (Object.keys(defaults).length > 0) {
      out[job.name] = defaults;
    }
  });

  return out;
}

const valueOf = (v: unknown): ParamValue => {
  if (Array.isArray(v)) {
    return v.map(String);
  }
  if (isObject(v) && v.value !== undefined) {
    return valueOf(v.value);
  }

  return v === undefined || v === null ? '' : String(v);
};

/** Turns `{name: value-or-{value,description}}` into a list, backfilling the definition from `defaults`. */
export function normalizeParameters(
  parameters: RawParameters = {},
  defaults: RawParameters = {}
): Parameter[] {
  return Object.entries(parameters).map(([name, raw]) => {
    const current = valueOf(raw);
    const description =
      isObject(raw) && typeof raw.description === 'string'
        ? raw.description
        : '';
    const definition = Object.hasOwn(defaults, name) ? defaults[name] : raw;
    const defaultDescription =
      isObject(definition) && typeof definition.description === 'string'
        ? definition.description
        : description;

    return {
      name,
      value: Array.isArray(current) ? current[0] ?? '' : current,
      defaultValues: valueOf(definition),
      description: defaultDescription
    };
  });
}

/**
 * Groups for the form. The group of the job being started comes first (open),
 * then "Shared", then the other jobs.
 */
export function getParameterGroups(args: {
  pipelineParameters?: RawParameters;
  pipelineDefinitions?: RawParameters;
  jobParameters?: RawParameters;
  jobDefinitions?: RawParameters;
  startFrom?: string | null;
  sharedTitle: string;
  jobTitle: (name: string) => string;
}): ParameterGroup[] {
  const {
    pipelineParameters = {},
    pipelineDefinitions = {},
    jobParameters = {},
    jobDefinitions = {},
    startFrom
  } = args;
  const lead: ParameterGroup[] = [];
  const rest: ParameterGroup[] = [];

  Object.entries(jobParameters).forEach(([jobName, parameters]) => {
    const group: ParameterGroup = {
      jobName,
      title: args.jobTitle(jobName),
      parameters: normalizeParameters(
        parameters as RawParameters,
        jobDefinitions[jobName] as RawParameters
      ),
      isOpen: false
    };

    (startFrom === jobName ? lead : rest).push(group);
  });

  if (Object.keys(pipelineParameters).length > 0) {
    lead.push({
      jobName: null,
      title: args.sharedTitle,
      parameters: normalizeParameters(pipelineParameters, pipelineDefinitions),
      isOpen: false
    });
  }
  const [head, ...others] = lead;

  return head ? [{ ...head, isOpen: true }, ...others, ...rest] : rest;
}

export interface SelectedParameters {
  pipeline: ValueMap;
  job: JobValueMap;
}

/** `{name: v, jobName: {name: v}}`: the request body shape (`meta.parameters`). */
export function flattenParameters({
  pipeline,
  job
}: SelectedParameters): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  Object.entries(pipeline).forEach(([name, { value }]) => {
    out[name] = value;
  });
  Object.entries(job).forEach(([jobName, group]) => {
    out[jobName] = Object.fromEntries(
      Object.entries(group).map(([name, { value }]) => [name, value])
    );
  });

  return out;
}

/** True when anything can be configured: pipeline or job definitions, or parameters on the event. */
export function isParameterized(
  pipelineParameters: RawParameters | undefined,
  jobDefinitions: JobValueMap | undefined,
  eventParameters: RawParameters | undefined
): boolean {
  return [pipelineParameters, jobDefinitions, eventParameters].some(
    p => p && Object.keys(p).length > 0
  );
}

export interface ParameterError {
  /** jobName, or null for pipeline-level. */
  group: string | null;
  name: string;
  reason: 'empty';
}

/**
 * A parameter with a list of choices accepts any of them, or a typed override
 * (Ember's "Press enter to override"). The one hard rule: a parameter that
 * has a default must not be submitted blank, because the build would run with
 * an empty string and nothing to show it was unintended.
 */
export function validateParameters(
  groups: ParameterGroup[],
  selected: SelectedParameters
): ParameterError[] {
  const errors: ParameterError[] = [];

  groups.forEach(group => {
    group.parameters.forEach(p => {
      const value =
        group.jobName === null
          ? selected.pipeline[p.name]?.value
          : selected.job[group.jobName]?.[p.name]?.value;
      const hasDefault =
        (Array.isArray(p.defaultValues)
          ? p.defaultValues[0]
          : p.defaultValues) !== '';

      if (hasDefault && (value === undefined || value.trim() === '')) {
        errors.push({ group: group.jobName, name: p.name, reason: 'empty' });
      }
    });
  });

  return errors;
}
