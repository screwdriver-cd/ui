import { Icon } from '~/components/Icon';
import { useEffect, useId, useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import {
  flattenParameters,
  getParameterGroups,
  validateParameters,
  type JobValueMap,
  type Parameter,
  type RawParameters,
  type SelectedParameters,
  type ValueMap
} from '../../utils/parameters';

export interface ParametersFormProps {
  /** Starting values: the defaults, or the event's parameters when restarting. */
  pipelineParameters: RawParameters;
  jobParameters: RawParameters;
  /** Definitions (choices, descriptions, defaults) from the pipeline and its jobs. */
  pipelineDefinitions: RawParameters;
  jobDefinitions: RawParameters;
  /** The job being started: its group is listed first. */
  startFrom?: string | null;
  /** Called on mount and on every edit with the request body and whether it can be submitted. */
  onChange: (parameters: Record<string, unknown>, valid: boolean) => void;
}

function toValues(parameters: RawParameters): ValueMap {
  return Object.fromEntries(
    Object.entries(parameters).map(([name, v]) => [
      name,
      { value: String((v as { value?: unknown })?.value ?? '') }
    ])
  );
}

function toJobValues(parameters: RawParameters): JobValueMap {
  return Object.fromEntries(
    Object.entries(parameters).map(([job, group]) => [
      job,
      toValues(group as RawParameters)
    ])
  );
}

const CUSTOM = '\u0000custom';

function ParameterField({
  parameter,
  value,
  invalid,
  onInput
}: {
  parameter: Parameter;
  value: string;
  invalid: boolean;
  onInput: (value: string) => void;
}) {
  const t = useT();
  const id = useId();
  const choices = Array.isArray(parameter.defaultValues)
    ? parameter.defaultValues
    : null;
  const defaultText = choices
    ? choices[0]
    : (parameter.defaultValues as string);
  const changed = value !== defaultText;
  const [custom, setCustom] = useState(
    () => Boolean(choices) && !choices?.includes(value)
  );
  const showText = !choices || custom;

  return (
    <div className="parameter">
      <Form.Label
        htmlFor={id}
        className="parameter-name"
        title={parameter.name}
      >
        {parameter.name}
        {parameter.description ? (
          <span
            className="parameter-help"
            title={parameter.description}
            aria-label={parameter.description}
          >
            {' '}
            ?
          </span>
        ) : null}
        {changed ? (
          <span
            className="parameter-changed"
            title={t('pipeline.parameters.default', { value: defaultText })}
          >
            {' '}
            !
          </span>
        ) : null}
      </Form.Label>
      {choices ? (
        <Form.Select
          id={id}
          size="sm"
          value={custom ? CUSTOM : value}
          onChange={e => {
            if (e.target.value === CUSTOM) {
              setCustom(true);
            } else {
              setCustom(false);
              onInput(e.target.value);
            }
          }}
        >
          {choices.map(choice => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
          <option value={CUSTOM}>{t('pipeline.parameters.other')}</option>
        </Form.Select>
      ) : null}
      {showText ? (
        <Form.Control
          id={choices ? undefined : id}
          aria-label={
            choices
              ? t('pipeline.parameters.override', { name: parameter.name })
              : undefined
          }
          size="sm"
          value={value}
          isInvalid={invalid}
          onChange={e => onInput(e.target.value)}
        />
      ) : null}
      {invalid ? (
        <Form.Control.Feedback type="invalid">
          {t('pipeline.parameters.required')}
        </Form.Control.Feedback>
      ) : null}
    </div>
  );
}

/**
 * Pipeline ("Shared") and per-job parameters for starting or restarting an
 * event. The first group is open; fields with a list of choices take any of
 * them or a typed override.
 */
export function ParametersForm({
  pipelineParameters,
  jobParameters,
  pipelineDefinitions,
  jobDefinitions,
  startFrom,
  onChange
}: ParametersFormProps) {
  const t = useT();
  const groups = useMemo(
    () =>
      getParameterGroups({
        pipelineParameters,
        pipelineDefinitions,
        jobParameters,
        jobDefinitions,
        startFrom,
        sharedTitle: t('pipeline.parameters.shared'),
        jobTitle: name => t('pipeline.parameters.job', { name })
      }),
    // The inputs are snapshots taken when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [selected, setSelected] = useState<SelectedParameters>(() => ({
    pipeline: toValues(pipelineParameters),
    job: toJobValues(jobParameters)
  }));
  const [open, setOpen] = useState(
    () => new Set(groups.filter(g => g.isOpen).map(g => g.title))
  );
  const errors = validateParameters(groups, selected);

  // Report the initial values once, so submitting without touching the form still sends them.
  useEffect(() => {
    onChange(flattenParameters(selected), errors.length === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (group: string | null, name: string, value: string) => {
    const next: SelectedParameters =
      group === null
        ? { ...selected, pipeline: { ...selected.pipeline, [name]: { value } } }
        : {
            ...selected,
            job: {
              ...selected.job,
              [group]: { ...selected.job[group], [name]: { value } }
            }
          };

    setSelected(next);
    onChange(
      flattenParameters(next),
      validateParameters(groups, next).length === 0
    );
  };

  const toggle = (title: string) =>
    setOpen(prev => {
      const next = new Set(prev);

      if (!next.delete(title)) {
        next.add(title);
      }

      return next;
    });

  return (
    <div className="pipeline-parameters" data-testid="parameters-form">
      <div className="parameter-title">
        {t('pipeline.parameters.formTitle')}
      </div>
      {groups.map(group => {
        const expanded = open.has(group.title);

        return (
          <div className="parameter-group" key={group.title}>
            <button
              type="button"
              className="group-title btn btn-link p-0"
              aria-expanded={expanded}
              onClick={() => toggle(group.title)}
            >
              <Icon name={expanded ? 'squareMinus' : 'squarePlus'} />{' '}
              {group.title}
            </button>
            {expanded ? (
              <div className="parameter-list">
                {group.parameters.map(p => {
                  const value =
                    group.jobName === null
                      ? selected.pipeline[p.name]?.value ?? ''
                      : selected.job[group.jobName]?.[p.name]?.value ?? '';

                  return (
                    <ParameterField
                      key={p.name}
                      parameter={p}
                      value={value}
                      invalid={errors.some(
                        e => e.group === group.jobName && e.name === p.name
                      )}
                      onInput={v => update(group.jobName, p.name, v)}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
