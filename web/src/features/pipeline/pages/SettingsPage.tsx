import { Link } from '@tanstack/react-router';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useT } from '~/i18n/useT';
import { usePipelineQuery } from '../api/queries';
import { usePipeline } from '../components/PipelineContext';
import { CacheSettings } from '../components/settings/CacheSettings';
import { JobsSettings } from '../components/settings/JobsSettings';
import { MainSettings } from '../components/settings/MainSettings';
import { MetricsSettings } from '../components/settings/MetricsSettings';
import { PreferencesSettings } from '../components/settings/PreferencesSettings';
import '../components/settings/settings.scss';

export type SettingsSection =
  | 'main'
  | 'jobs'
  | 'cache'
  | 'metrics'
  | 'preferences';
const SECTIONS: SettingsSection[] = [
  'main',
  'jobs',
  'cache',
  'metrics',
  'preferences'
];

/** Options: Pipeline | Jobs | Cache | Metrics | Preferences (Ember v2 settings tabs). */
export function SettingsPage({
  section = 'main'
}: {
  section?: SettingsSection;
}) {
  const t = useT();
  const { pipeline } = usePipeline();
  const fresh = usePipelineQuery(pipeline.id).data ?? pipeline;

  return (
    <div className="pipeline-page pipeline-settings">
      <div className="settings-tabs-band">
        <ul className="nav nav-tabs settings-tabs">
          {SECTIONS.map(s => (
            <li className="nav-item" key={s}>
              <Link
                to={
                  `/v2/pipelines/${pipeline.id}/settings${
                    s === 'main' ? '' : `/${s}`
                  }` as never
                }
                className="nav-link"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'nav-link active' }}
              >
                {t(`pipeline.settings.tab.${s}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <ScrollRegion className="settings-content">
        {section === 'main' ? <MainSettings pipeline={fresh} /> : null}
        {section === 'jobs' ? <JobsSettings pipeline={fresh} /> : null}
        {section === 'cache' ? <CacheSettings pipeline={fresh} /> : null}
        {section === 'metrics' ? <MetricsSettings pipeline={fresh} /> : null}
        {section === 'preferences' ? (
          <PreferencesSettings pipeline={fresh} />
        ) : null}
      </ScrollRegion>
    </div>
  );
}
