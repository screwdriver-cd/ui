import { useState } from 'react';
import { CloseButton, Form } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import {
  TIMESTAMP_FORMATS,
  useResetUserSettings,
  useSaveUserSettings,
  useUserSettings,
  type TimestampFormat
} from '../lib/settings';
import styles from '../user-settings.module.scss';

export function PreferencesPage() {
  const t = useT();
  const { data, isPending } = useUserSettings();
  const save = useSaveUserSettings();
  const reset = useResetUserSettings();

  const [format, setFormat] = useState<TimestampFormat>('LOCAL_TIMEZONE');
  const [notify, setNotify] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'warning';
    text: string;
  } | null>(null);

  // Reset the form when the server copy changes (adjusting state during render, not in an effect).
  const [syncedFrom, setSyncedFrom] = useState<typeof data>(undefined);

  const savedFormat: TimestampFormat =
    data?.timestampFormat === 'UTC' ? 'UTC' : 'LOCAL_TIMEZONE';
  const savedNotify = data?.allowNotification === true;

  if (data !== syncedFrom) {
    setSyncedFrom(data);
    if (data) {
      setFormat(savedFormat);
      setNotify(savedNotify);
    }
  }

  const busy = save.isPending || reset.isPending;

  // Only what the user changed is sent: the save merges it into a fresh server copy, so a value
  // changed in another tab since this page loaded is kept.
  const persist = async (patch: {
    timestampFormat?: TimestampFormat;
    allowNotification?: boolean;
  }) => {
    try {
      // Per-pipeline preferences (numeric keys) and Ember's displayJobNameLength are merged in from
      // the server copy.
      await save.mutateAsync(patch);
      setMessage({ type: 'success', text: t('userSettings.prefs.saved') });
    } catch (error) {
      setMessage({
        type: 'warning',
        text: error instanceof Error ? error.message : t('common.error')
      });
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    let allowed = enabled;

    if (
      enabled &&
      typeof Notification !== 'undefined' &&
      Notification.permission !== 'granted'
    ) {
      allowed = (await Notification.requestPermission()) === 'granted';
    }
    setNotify(allowed);
    // The switch saves at once; an unsaved timestamp format waits for Save.
    await persist({ allowNotification: allowed });
  };

  const doReset = async () => {
    try {
      await reset.mutateAsync();
      setMessage({ type: 'success', text: t('userSettings.prefs.resetDone') });
    } catch (error) {
      setMessage({
        type: 'warning',
        text: error instanceof Error ? error.message : t('common.error')
      });
    }
  };

  return (
    <section aria-label={t('userSettings.tab.preferences')}>
      {message ? (
        <div className={`${styles.info} ${styles[message.type]}`} role="alert">
          <span>{message.text}</span>
          <CloseButton className="ms-auto" onClick={() => setMessage(null)} />
        </div>
      ) : null}
      <div className={styles.prefs}>
        <div className={styles.pref}>
          <div>
            <h2 id="pref-timestamp">
              {t('userSettings.prefs.timestamp.title')}
            </h2>
            <p>{t('userSettings.prefs.timestamp.help')}</p>
          </div>
          <div>
            <Form.Select
              aria-labelledby="pref-timestamp"
              value={format}
              disabled={isPending}
              onChange={event =>
                setFormat(event.target.value as TimestampFormat)
              }
            >
              {TIMESTAMP_FORMATS.map(option => (
                <option key={option} value={option}>
                  {t(`userSettings.prefs.timestamp.${option}`)}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>
        <div className={styles.pref}>
          <div>
            <h2>{t('userSettings.prefs.notify.title')}</h2>
            <p>{t('userSettings.prefs.notify.help')}</p>
          </div>
          <div>
            <Form.Check
              type="switch"
              id="pref-notify"
              label={t('userSettings.prefs.notify.label')}
              checked={notify}
              disabled={isPending || busy}
              onChange={event => toggleNotifications(event.target.checked)}
            />
          </div>
        </div>
        <div className={`${styles.pref} ${styles.actions}`}>
          <button
            type="button"
            className={styles.resetButton}
            disabled={busy}
            onClick={doReset}
          >
            {t('userSettings.prefs.reset')}
          </button>
          <button
            type="button"
            className={styles.blueButton}
            disabled={busy || isPending}
            onClick={() =>
              persist({
                ...(format !== savedFormat ? { timestampFormat: format } : {}),
                ...(notify !== savedNotify ? { allowNotification: notify } : {})
              })
            }
          >
            {save.isPending
              ? t('userSettings.prefs.saving')
              : t('userSettings.prefs.save')}
          </button>
        </div>
      </div>
    </section>
  );
}
