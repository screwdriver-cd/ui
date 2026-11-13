import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { saveUserSettings, updatePipeline } from '../../api/mutations';
import { keys, useUserSettings } from '../../api/queries';
import type { Pipeline } from '../../types';
import { showPrJobsOf } from '../../utils/pipeline';
import { Switch } from './SettingsTable';
import './settings.scss';

function PreferenceRow({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-preference">
      <div>
        <div className="settings-card-title">{title}</div>
        <div className="settings-preference-help">{description}</div>
      </div>
      {children}
    </div>
  );
}

export function PreferencesSettings({ pipeline }: { pipeline: Pipeline }) {
  const t = useT();
  const queryClient = useQueryClient();
  const userSettings = useUserSettings();
  const [error, setError] = useState<string | null>(null);
  // One save at a time. Each sends only the key it changes: the API merges it
  // into the stored settings, so a stale copy of the others cannot overwrite them.
  const [saving, setSaving] = useState(false);
  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    setSaving(true);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const savePipeline = (key: string, value: boolean) =>
    run(async () => {
      await updatePipeline(pipeline.id, {
        settings: { [key]: value }
      });
      await queryClient.invalidateQueries({
        queryKey: keys.pipeline(pipeline.id)
      });
    });
  const saveUser = (patch: Record<string, unknown>) =>
    run(async () => {
      queryClient.setQueryData(
        keys.userSettings,
        await saveUserSettings(patch)
      );
    });
  const pipelineRows: Array<[string, string, string, string]> = [
    [
      'showEventTriggers',
      'pipeline.settings.showTriggers',
      'pipeline.settings.showTriggersHelp',
      'pipeline.settings.showTriggersToggle'
    ],
    [
      'filterSchedulerEvents',
      'pipeline.settings.filterScheduler',
      'pipeline.settings.filterSchedulerHelp',
      'pipeline.settings.filterSchedulerToggle'
    ],
    [
      'filterEventsForNoBuilds',
      'pipeline.settings.filterNoBuilds',
      'pipeline.settings.filterNoBuildsHelp',
      'pipeline.settings.filterNoBuildsToggle'
    ]
  ];

  return (
    <>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <section className="settings-card settings-preferences">
        <div className="settings-section-header">
          <div className="settings-section-title">
            {t('pipeline.settings.pipelinePrefs')}
          </div>
          <div className="settings-section-help">
            {t('pipeline.settings.pipelinePrefsHelp')}
          </div>
        </div>
        {pipelineRows.map(([key, title, help, label]) => (
          <PreferenceRow key={key} title={t(title)} description={t(help)}>
            <Switch
              id={`setting-${key}`}
              label={t(label)}
              checked={Boolean(pipeline.settings?.[key])}
              disabled={saving}
              onChange={checked => savePipeline(key, checked)}
            />
          </PreferenceRow>
        ))}
      </section>
      <section className="settings-card settings-preferences">
        <div className="settings-section-header">
          <div className="settings-section-title">
            {t('pipeline.settings.userPrefs')}
          </div>
          <div className="settings-section-help">
            {t('pipeline.settings.userPrefsHelp')}
          </div>
        </div>
        <PreferenceRow
          title={t('pipeline.settings.showPrJobsTitle')}
          description={t('pipeline.settings.showPrJobsHelp')}
        >
          <Switch
            id="pref-groupbuild"
            label={t('pipeline.settings.showPrJobsToggle')}
            checked={showPrJobsOf(userSettings.data, pipeline.id)}
            disabled={userSettings.isLoading || saving}
            onChange={checked =>
              saveUser({
                [pipeline.id]: {
                  ...((userSettings.data?.[pipeline.id] as
                    | object
                    | undefined) ?? {}),
                  showPRJobs: checked
                }
              })
            }
          />
        </PreferenceRow>
        <PreferenceRow
          title={t('pipeline.settings.timestamp')}
          description={t('pipeline.settings.timestampHelp')}
        >
          <Form.Select
            id="pref-timestamp"
            size="sm"
            className="settings-timestamp"
            aria-label={t('pipeline.settings.timestamp')}
            disabled={saving}
            value={
              (userSettings.data?.timestampFormat as string) ?? 'LOCAL_TIMEZONE'
            }
            onChange={e => saveUser({ timestampFormat: e.target.value })}
          >
            <option value="LOCAL_TIMEZONE">
              {t('pipeline.settings.timestampLocal')}
            </option>
            <option value="UTC">{t('pipeline.settings.timestampUtc')}</option>
          </Form.Select>
        </PreferenceRow>
      </section>
    </>
  );
}
