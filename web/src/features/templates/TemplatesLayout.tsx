import {
  Link,
  Outlet,
  useParams,
  useRouterState
} from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';
import { config } from '~/config/config';
import { useT } from '~/i18n/useT';
import './templates.scss';

export function Crumbs({
  crumbs
}: {
  crumbs: Array<{ name: string; to: string }>;
}) {
  return (
    <nav aria-label="breadcrumb" className="bread-crumbs mb-2">
      {crumbs.map((c, i) => (
        <span key={c.to}>
          {i > 0 ? <span className="bread-crumb-divider"> / </span> : null}
          {i === crumbs.length - 1 && i > 0 ? (
            c.name
          ) : (
            <Link to={c.to}>{c.name}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function TemplatesLayout() {
  const t = useT();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const { namespace, name } = useParams({ strict: false }) as {
    namespace?: string;
    name?: string;
  };
  const kind = pathname.startsWith('/templates/pipeline') ? 'pipeline' : 'job';
  const isIndex = /^\/templates\/(pipeline|job)\/?$/.test(pathname);
  const base = `/templates/${kind}`;
  const crumbs: Array<{ name: string; to: string }> = [];

  if (namespace) {
    crumbs.push({ name: t(`template.crumb.${kind}`), to: base });
    crumbs.push({ name: namespace, to: `${base}/${namespace}` });
  }
  if (name) {
    crumbs.push({ name, to: `${base}/${namespace}/${name}` });
  }

  const header = (
    <div className="template-page__header">
      {isIndex ? (
        <>
          <header className="templates-header">
            <h4>
              {t('template.list.title')}
              <a
                className="doc-link float-end fs-6 fw-normal"
                href={`${config.docUrl}/user-guide/templates/${kind}-templates`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('template.list.docs')}
              </a>
            </h4>
            <div className="template-description">
              {t('template.list.description')}
            </div>
          </header>
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <Link
                to="/templates/pipeline"
                className={`nav-link${kind === 'pipeline' ? ' active' : ''}`}
              >
                {t('template.tabs.pipelines')}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/templates/job"
                className={`nav-link${kind === 'job' ? ' active' : ''}`}
              >
                {t('template.tabs.jobs')}
              </Link>
            </li>
          </ul>
        </>
      ) : null}
      {crumbs.length ? <Crumbs crumbs={crumbs} /> : null}
    </div>
  );

  return (
    <PageLayout header={header} scroll={false}>
      <div className="fill-col templates">
        <Outlet />
      </div>
    </PageLayout>
  );
}
