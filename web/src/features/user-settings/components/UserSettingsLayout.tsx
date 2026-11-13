import {
  Link,
  Outlet,
  useNavigate,
  useRouterState
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import { useDocumentTitle } from '~/features/collections/lib/useDocumentTitle';
import styles from '../user-settings.module.scss';

export function UserSettingsLayout() {
  const t = useT();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const tab = pathname.includes('access-tokens')
    ? 'access-tokens'
    : 'preferences';

  useDocumentTitle(t('userSettings.title'));

  // `/user-settings` itself is just a door to the preferences tab.
  useEffect(() => {
    if (/\/user-settings\/?$/.test(pathname)) {
      navigate({ to: '/user-settings/preferences', replace: true });
    }
  }, [pathname, navigate]);

  return (
    <PageLayout
      header={
        <div className={styles.header}>
          <h1>{t('userSettings.title')}</h1>
          <ul className={styles.tabs}>
            <li className={tab === 'preferences' ? styles.active : undefined}>
              <Link
                to="/user-settings/preferences"
                aria-current={tab === 'preferences' ? 'page' : undefined}
              >
                {t('userSettings.tab.preferences')}
              </Link>
            </li>
            <li className={tab === 'access-tokens' ? styles.active : undefined}>
              <Link
                to="/user-settings/access-tokens"
                aria-current={tab === 'access-tokens' ? 'page' : undefined}
              >
                {t('userSettings.tab.tokens')}
              </Link>
            </li>
          </ul>
        </div>
      }
    >
      <div className={styles.page}>
        <Outlet />
      </div>
    </PageLayout>
  );
}
