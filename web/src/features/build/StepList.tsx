import { Icon } from '~/components/Icon';
import { StatusIcon } from '../pipeline/components/StatusIcon';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useT } from '~/i18n/useT';
import type { BuildStep } from './types';
import { formatDuration } from '~/i18n/duration';
import { isSetupStep, isTeardownStep, msBetween, stepStatus } from './utils';

const STATUS = { queued: 'CREATED', running: 'RUNNING', success: 'SUCCESS', failure: 'FAILURE' } as const;

function StepItem({
  step,
  selected,
  onSelect
}: {
  step: BuildStep;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  const t = useT();
  const { locale } = useIntl();
  const status = stepStatus(step);
  const duration =
    step.startTime && step.endTime ? formatDuration(msBetween(step.startTime, step.endTime), locale) : null;

  return (
    <li className={`build-step ${status}${selected ? ' active' : ''}`}>
      <button
        type="button"
        className="build-step__button"
        aria-current={selected ? 'step' : undefined}
        onClick={() => onSelect(step.name)}
      >
        <span className="build-step__icon" role="img" aria-label={t(`build.step.${status}`)}>
          <StatusIcon status={STATUS[status]} />
        </span>
        <span className="name">{step.name}</span>
        {duration ? <span className="duration">{duration}</span> : null}
      </button>
    </li>
  );
}

interface Props {
  steps: BuildStep[];
  selected: string | null;
  onSelect: (name: string) => void;
}

export function StepList({ steps, selected, onSelect }: Props) {
  const t = useT();
  const setup = steps.filter(s => isSetupStep(s.name));
  const teardown = steps.filter(s => isTeardownStep(s.name));
  const user = steps.filter(s => !isSetupStep(s.name) && !isTeardownStep(s.name));
  const [setupOpen, setSetupOpen] = useState<boolean | undefined>(undefined);
  const [teardownOpen, setTeardownOpen] = useState<boolean | undefined>(undefined);
  // Collapsed unless the selected step lives in the group (until the user toggles it).
  const isOpen = (override: boolean | undefined, group: BuildStep[]) =>
    override ?? group.some(s => s.name === selected);

  return (
    <div className="build-steps">
      <h3>{t('build.steps.title')}</h3>
      <button
        type="button"
        className="btn btn-link step-toggle"
        aria-expanded={isOpen(setupOpen, setup)}
        onClick={() => setSetupOpen(!isOpen(setupOpen, setup))}
      >
        <Icon name={isOpen(setupOpen, setup) ? 'chevronDown' : 'chevronRight'} /> {t('build.steps.setup')}
      </button>
      {isOpen(setupOpen, setup) ? (
        <ul className="setup indent">
          {setup.map(s => (
            <StepItem key={s.name} step={s} selected={s.name === selected} onSelect={onSelect} />
          ))}
        </ul>
      ) : null}
      <ul className="user-steps">
        {user.map(s => (
          <StepItem key={s.name} step={s} selected={s.name === selected} onSelect={onSelect} />
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-link step-toggle"
        aria-expanded={isOpen(teardownOpen, teardown)}
        onClick={() => setTeardownOpen(!isOpen(teardownOpen, teardown))}
      >
        <Icon name={isOpen(teardownOpen, teardown) ? 'chevronDown' : 'chevronRight'} /> {t('build.steps.teardown')}
      </button>
      {isOpen(teardownOpen, teardown) ? (
        <ul className="teardown indent">
          {teardown.map(s => (
            <StepItem key={s.name} step={s} selected={s.name === selected} onSelect={onSelect} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
