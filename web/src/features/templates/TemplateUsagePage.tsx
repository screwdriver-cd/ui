import { Link, useParams } from '@tanstack/react-router';
import { format as fmt } from 'date-fns';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useT } from '~/i18n/useT';
import { useTemplateUsage } from './api';

export function TemplateUsagePage() {
  const t = useT();
  const { namespace, name, version } = useParams({ strict: false }) as {
    namespace: string;
    name: string;
    version: string;
  };
  const q = useTemplateUsage(namespace, name, version);
  const rows = q.data ?? [];

  return (
    <ScrollRegion className="template-page__body">
      <br />
      {q.isLoading ? <div>{t('common.loading')}</div> : null}
      {q.isError ? (
        <div className="alert alert-warning">{t('common.error')}</div>
      ) : null}
      {q.data && rows.length === 0 ? (
        <div>{t('template.usage.none')}</div>
      ) : null}
      {rows.length > 0 ? (
        <>
          <h1>
            {t('template.usage.heading', {
              name: `${namespace}/${name}@${version}`
            })}
          </h1>
          <table className="table table-sm">
            <thead>
              <tr>
                <th scope="col">{t('template.usage.col.name')}</th>
                <th scope="col">{t('template.usage.col.branch')}</th>
                <th scope="col">{t('template.usage.col.lastRun')}</th>
                <th scope="col">{t('template.usage.col.admin')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/pipelines/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>
                    <a href={p.scmRepo.url}>
                      {p.scmRepo.rootDir
                        ? `${p.scmRepo.branch}:${p.scmRepo.rootDir}`
                        : p.scmRepo.branch}
                    </a>
                  </td>
                  <td>
                    {p.lastRun
                      ? fmt(new Date(p.lastRun), 'MM/dd/yyyy')
                      : '--/--/----'}
                  </td>
                  <td>{Object.keys(p.admins ?? {}).join(',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </ScrollRegion>
  );
}
