import { useEffect } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';
import { ScrollRegion } from '~/components/ScrollRegion';
import { ApiError } from '~/api/client';
import { useSession } from '~/auth/session';
import { useT } from '~/i18n/useT';
import {
  readLastViewed,
  useCollection,
  useCollections,
  writeLastViewed
} from '../lib/api';
import { collectionPath } from '../lib/links';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { CollectionView } from './CollectionView';
import { CollectionsFlyout } from './CollectionsFlyout';
import { HomeHero } from './HomeHero';
import styles from '../collections.module.scss';

/** `/`: the hero, and for signed-in users a redirect to their last (or default) collection. */
export function HomePage() {
  const t = useT();
  const navigate = useNavigate();
  const isGuest = useSession(s => s.data?.isGuest ?? false);
  const { data: collections } = useCollections();

  useDocumentTitle(t('app.title'));

  useEffect(() => {
    if (isGuest || !collections?.length) {
      return;
    }

    const target =
      readLastViewed() ??
      (collections.find(c => c.type === 'default') ?? collections[0])!.id;

    navigate({ to: collectionPath(target), replace: true });
  }, [collections, isGuest, navigate]);

  return (
    <PageLayout>
      <HomeHero />
    </PageLayout>
  );
}

/** `/dashboards`: jump to the newest collection, or to search when there is none. */
export function DashboardIndexPage() {
  const navigate = useNavigate();
  const { data, isError } = useCollections();

  useEffect(() => {
    if (isError) {
      navigate({ to: '/', replace: true });
    } else if (data) {
      // The last one in the list is the first collection the user created.
      const last = data[data.length - 1];

      navigate({
        to: last ? collectionPath(last.id) : '/search',
        replace: true
      });
    }
  }, [data, isError, navigate]);

  return null;
}

/** `/dashboards/$collectionId` */
export function DashboardShowPage() {
  const t = useT();
  const navigate = useNavigate();
  const { collectionId } = useParams({ strict: false }) as {
    collectionId: string;
  };
  const { data: collection, error } = useCollection(collectionId);

  useDocumentTitle(
    collection
      ? `${collection.name} - ${t('collections.dashboard')}`
      : t('collections.dashboard')
  );

  useEffect(() => {
    if (collection) {
      writeLastViewed(collection.id);
    }
  }, [collection]);

  useEffect(() => {
    if (error) {
      writeLastViewed(null);
    }
  }, [error]);

  return (
    <PageLayout scroll={false}>
      <div className={styles.layout}>
        <CollectionsFlyout
          selectedId={collectionId}
          onDeleted={() => navigate({ to: '/' })}
        />
        {collection ? (
          <CollectionView key={collection.id} collection={collection} />
        ) : error ? (
          <ScrollRegion>
            <div className="p-4" role="alert">
              <h2>
                {t(
                  error instanceof ApiError && error.isNotFound
                    ? 'collections.notFound.title'
                    : 'common.error'
                )}
              </h2>
              <Link to="/">{t('nav.home')}</Link>
            </div>
          </ScrollRegion>
        ) : (
          <p className="p-3">{t('common.loading')}</p>
        )}
      </div>
    </PageLayout>
  );
}
