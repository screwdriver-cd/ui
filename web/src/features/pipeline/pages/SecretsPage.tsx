import { Icon } from '~/components/Icon';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useT } from '~/i18n/useT';
import { createSecret, deleteSecret, updateSecret } from '../api/mutations';
import { keys, useInheritedSecrets, useSecrets } from '../api/queries';
import { ConfirmModal } from '../components/ConfirmModal';
import { usePipeline } from '../components/PipelineContext';
import { SecretsTabs } from '../components/SecretsTabs';
import { FilterInput, TableFooter } from '../components/TableControls';
import type { Secret } from '../types';

const NAME_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const DOCS_URL = 'https://docs.screwdriver.cd/user-guide/configuration/secrets';

/** One row of the merged table (Ember pipeline-secrets service + secrets/table mapSecrets). */
interface SecretRow {
  secret: Secret;
  /** A secret with this name exists on the parent (config) pipeline. */
  inherited: boolean;
  /** This pipeline has its own value (a plain secret, or an override of an inherited one). */
  owned: boolean;
}

/**
 * Parent secrets first, then this pipeline's secrets by name on top, so an override replaces
 * the inherited row. The API's child list may already include parent secrets (pipelineId is
 * the parent's); those stay inherited and not owned.
 */
function mergeSecrets(
  pipelineId: number,
  own: Secret[],
  parent: Secret[]
): SecretRow[] {
  const parentNames = new Set(parent.map(s => s.name));
  const rows = new Map<string, SecretRow>();

  parent.forEach(secret =>
    rows.set(secret.name, { secret, inherited: true, owned: false })
  );
  own.forEach(secret => {
    const owned =
      secret.pipelineId === undefined || secret.pipelineId === pipelineId;

    rows.set(secret.name, {
      secret,
      inherited: parentNames.has(secret.name) || !owned,
      owned
    });
  });

  return [...rows.values()];
}

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; row: SecretRow }
  | { kind: 'delete'; row: SecretRow }
  | null;

type YesNo = '' | 'yes' | 'no';

const matches = (filter: YesNo, value: boolean) =>
  filter === '' || (filter === 'yes') === value;

export function SecretsPage() {
  const t = useT();
  const { pipeline } = usePipeline();
  const queryClient = useQueryClient();
  const secrets = useSecrets(pipeline.id);
  const parentId = pipeline.configPipelineId;
  const inherited = useInheritedSecrets(parentId);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [allowInPR, setAllowInPR] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [keyFilter, setKeyFilter] = useState('');
  const [prFilter, setPrFilter] = useState<YesNo>('');
  const [inheritedFilter, setInheritedFilter] = useState<YesNo>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: keys.secrets(pipeline.id) });
  const open = (next: Dialog) => {
    setName(next?.kind === 'edit' ? next.row.secret.name : '');
    setValue('');
    setAllowInPR(next?.kind === 'edit' ? next.row.secret.allowInPR : false);
    setConfirmName('');
    setDialog(next);
  };

  const rows = useMemo(
    () =>
      mergeSecrets(
        pipeline.id,
        secrets.data ?? [],
        parentId ? inherited.data ?? [] : []
      ),
    [pipeline.id, secrets.data, inherited.data, parentId]
  );
  const filtered = useMemo(() => {
    const wanted = keyFilter.trim().toLowerCase();
    const sign = sortDir === 'asc' ? 1 : -1;

    return rows
      .filter(
        r =>
          (!wanted || r.secret.name.toLowerCase().includes(wanted)) &&
          matches(prFilter, r.secret.allowInPR) &&
          matches(inheritedFilter, r.inherited)
      )
      .sort((a, b) => sign * a.secret.name.localeCompare(b.secret.name));
  }, [rows, keyFilter, prFilter, inheritedFilter, sortDir]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * pageSize, current * pageSize);
  const first = filtered.length === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, filtered.length);
  const existingNames = new Set(rows.filter(r => r.owned).map(r => r.secret.name));
  const filterOn =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const keyLabel = t('pipeline.secrets.key');
  const prLabel = t('pipeline.secrets.allowInPr');
  const inheritedLabel = t('pipeline.secrets.inheritedColumn');
  const yesNoSelect = (
    label: string,
    filter: YesNo,
    onChange: (v: YesNo) => void
  ) => (
    <Form.Select
      size="sm"
      aria-label={t('pipeline.jobs.filterBy', { column: label })}
      value={filter}
      onChange={e => onChange(e.target.value as YesNo)}
    >
      <option value="" />
      <option value="yes">{t('pipeline.common.yes')}</option>
      <option value="no">{t('pipeline.common.no')}</option>
    </Form.Select>
  );

  const isOverride = dialog?.kind === 'edit' && !dialog.row.owned;
  const isRevert =
    dialog?.kind === 'delete' && dialog.row.inherited && dialog.row.owned;

  return (
    <ScrollRegion>
      <div className="pipeline-page pipeline-secrets">
        <SecretsTabs active="secrets" />
        {secrets.isError || inherited.isError ? (
          <Alert variant="danger">{t('common.error')}</Alert>
        ) : null}
        <div className="d-flex justify-content-between mb-2">
          <div>
            <h2 className="h6 mb-1">
              {t('pipeline.secrets.title')}{' '}
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                id="secrets-docs"
                aria-label={t('pipeline.secrets.docs')}
                title={t('pipeline.secrets.docs')}
              >
                <Icon name="circleInfo" />
              </a>
            </h2>
            <div className="small text-muted secrets-explanation">
              <div>{t('pipeline.secrets.yamlNote')}</div>
              {parentId ? (
                <div id="parent-secrets">
                  <Link to={`/v2/pipelines/${parentId}/secrets` as never}>
                    {t('pipeline.secrets.inheritedLink')}
                  </Link>{' '}
                  {t('pipeline.secrets.inheritedNote')}
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <Button
              size="sm"
              id="add-secret"
              disabled={secrets.isPending}
              onClick={() => open({ kind: 'create' })}
            >
              <Icon name="plus" /> {t('pipeline.secrets.add')}
            </Button>
          </div>
        </div>
        <table className="table table-sm" id="secrets-table">
          <thead>
            <tr>
              <th
                className="key-column"
                aria-sort={sortDir === 'asc' ? 'ascending' : 'descending'}
              >
                <button
                  type="button"
                  className="jobs-sort"
                  onClick={() => {
                    setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
                    setPage(1);
                  }}
                >
                  {keyLabel}
                  <Icon name={sortDir === 'asc' ? 'sortUp' : 'sortDown'} />
                </button>
                <FilterInput
                  value={keyFilter}
                  onChange={filterOn(setKeyFilter)}
                  label={t('pipeline.jobs.filterBy', { column: keyLabel })}
                  clearLabel={t('pipeline.jobs.clearFilter', {
                    column: keyLabel
                  })}
                />
              </th>
              <th className="allow-in-pr-column">
                {prLabel}
                {yesNoSelect(prLabel, prFilter, filterOn(setPrFilter))}
              </th>
              <th className="inherited-column">
                {inheritedLabel}
                {yesNoSelect(
                  inheritedLabel,
                  inheritedFilter,
                  filterOn(setInheritedFilter)
                )}
              </th>
              <th className="actions-column">
                {t('pipeline.secrets.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map(row => {
              const { secret } = row;
              const revert = row.inherited && row.owned;

              return (
                <tr key={secret.name} data-secret={secret.name}>
                  <td>{secret.name}</td>
                  <td>
                    {secret.allowInPR ? (
                      <Icon
                        name="circleCheck"
                        className="text-success"
                        aria-label={t('pipeline.common.yes')}
                      />
                    ) : null}
                  </td>
                  <td>
                    {row.inherited ? (
                      <Icon
                        name="circleCheck"
                        className="text-success"
                        aria-label={t('pipeline.common.yes')}
                      />
                    ) : null}
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      className="me-1"
                      aria-label={
                        row.owned
                          ? t('pipeline.secrets.editAria', { name: secret.name })
                          : t('pipeline.secrets.overrideAria', {
                              name: secret.name
                            })
                      }
                      onClick={() => open({ kind: 'edit', row })}
                    >
                      <Icon name="pen" />{' '}
                      {row.owned
                        ? t('pipeline.common.edit')
                        : t('pipeline.secrets.override')}
                    </Button>
                    {row.owned ? (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        aria-label={
                          revert
                            ? t('pipeline.secrets.revertAria', {
                                name: secret.name
                              })
                            : t('pipeline.secrets.deleteAria', {
                                name: secret.name
                              })
                        }
                        onClick={() => open({ kind: 'delete', row })}
                      >
                        <Icon name={revert ? 'rotateLeft' : 'trash'} />{' '}
                        {revert
                          ? t('pipeline.secrets.revert')
                          : t('pipeline.common.delete')}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {secrets.data && filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  {t('pipeline.secrets.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <TableFooter
          first={first}
          last={last}
          total={filtered.length}
          pageSize={pageSize}
          onPageSize={size => {
            setPageSize(size);
            setPage(1);
          }}
          page={current}
          pages={pages}
          onPage={setPage}
        />

        {dialog?.kind === 'create' || dialog?.kind === 'edit' ? (
          <ConfirmModal
            id="secret-modal"
            title={
              dialog.kind === 'create'
                ? t('pipeline.secrets.add')
                : isOverride
                ? t('pipeline.secrets.overrideTitle', { name })
                : t('pipeline.secrets.editTitle', { name })
            }
            confirmLabel={
              isOverride
                ? t('pipeline.secrets.override')
                : t('pipeline.common.save')
            }
            disabled={
              dialog.kind === 'create'
                ? !NAME_PATTERN.test(name) || !value || existingNames.has(name)
                : isOverride
                ? !value
                : !value && allowInPR === dialog.row.secret.allowInPR
            }
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              if (dialog.kind === 'create' || isOverride) {
                // Ember modal/edit: overriding an inherited secret creates one on this pipeline.
                await createSecret({
                  pipelineId: pipeline.id,
                  name,
                  value,
                  allowInPR
                });
              } else {
                // Each field is sent only when changed: a flag flipped in another tab stays.
                await updateSecret(dialog.row.secret.id, {
                  ...(allowInPR !== dialog.row.secret.allowInPR
                    ? { allowInPR }
                    : {}),
                  ...(value ? { value } : {})
                });
              }
              await refresh();
              setDialog(null);
            }}
          >
            {isOverride ? (
              <p className="small text-muted">
                {t('pipeline.secrets.overrideBody')}
              </p>
            ) : null}
            <Form.Group className="mb-2">
              <Form.Label htmlFor="secret-name">
                {t('pipeline.secrets.name')}
              </Form.Label>
              <Form.Control
                id="secret-name"
                value={name}
                disabled={dialog.kind === 'edit'}
                isInvalid={
                  dialog.kind === 'create' &&
                  name !== '' &&
                  (!NAME_PATTERN.test(name) || existingNames.has(name))
                }
                onChange={e => setName(e.target.value)}
              />
              <Form.Control.Feedback type="invalid">
                {existingNames.has(name)
                  ? t('pipeline.secrets.nameTaken')
                  : t('pipeline.secrets.nameHint')}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="secret-value">
                {t('pipeline.secrets.value')}
              </Form.Label>
              <Form.Control
                id="secret-value"
                as="textarea"
                rows={3}
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </Form.Group>
            <Form.Check
              id="secret-allow-pr"
              label={t('pipeline.secrets.allowInPr')}
              checked={allowInPR}
              onChange={e => setAllowInPR(e.target.checked)}
            />
          </ConfirmModal>
        ) : null}
        {dialog?.kind === 'delete' ? (
          <ConfirmModal
            id="delete-secret-modal"
            title={
              isRevert
                ? t('pipeline.secrets.revertTitle', {
                    name: dialog.row.secret.name
                  })
                : t('pipeline.secrets.deleteTitle', {
                    name: dialog.row.secret.name
                  })
            }
            confirmLabel={
              isRevert
                ? t('pipeline.secrets.revert')
                : t('pipeline.common.delete')
            }
            variant="danger"
            disabled={confirmName !== dialog.row.secret.name}
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              await deleteSecret(dialog.row.secret.id);
              await refresh();
              setDialog(null);
            }}
          >
            <p>
              {isRevert
                ? t('pipeline.secrets.revertBody')
                : t('pipeline.secrets.deleteBody')}
            </p>
            <Form.Group>
              <Form.Label htmlFor="secret-confirm-name">
                {t('pipeline.secrets.confirmName', {
                  name: dialog.row.secret.name
                })}
              </Form.Label>
              <Form.Control
                id="secret-confirm-name"
                value={confirmName}
                placeholder={dialog.row.secret.name}
                onChange={e => setConfirmName(e.target.value)}
                autoFocus
              />
            </Form.Group>
          </ConfirmModal>
        ) : null}
      </div>
    </ScrollRegion>
  );
}
