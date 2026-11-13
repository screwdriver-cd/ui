import { Link } from '@tanstack/react-router';
import { useT } from '~/i18n/useT';
import { usePipeline } from './PipelineContext';

/** Secrets and tokens are two tabs of one section in Ember. */
export function SecretsTabs({ active }: { active: 'secrets' | 'tokens' }) {
  const t = useT();
  const { pipelineId } = usePipeline();

  return (
    <ul className="nav nav-tabs mb-3 secrets-tabs">
      {(['secrets', 'tokens'] as const).map(tab => (
        <li className="nav-item" key={tab}>
          <Link
            to={`/v2/pipelines/${pipelineId}/${tab}` as never}
            className={`nav-link${active === tab ? ' active' : ''}`}
            activeOptions={{ exact: true }}
          >
            {t(`pipeline.nav.${tab}`)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
