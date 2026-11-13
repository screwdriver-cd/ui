import { useMemo, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { Icon } from '~/components/Icon';
import {
  FilterInput,
  PAGE_SIZES,
  TableFooter
} from '~/features/pipeline/components/TableControls';
import { useFormatRelative } from '~/features/pipeline/hooks/useFormat';
import { useLocale } from '~/i18n/I18nProvider';
import { useT } from '~/i18n/useT';
import {
  EXPIRY_KEYS,
  expiresAt,
  PERMISSIONS,
  useTokenMutations,
  useTokens,
  type ExpiryKey,
  type Token
} from '../lib/tokens';
import styles from '../user-settings.module.scss';

/** Value shown when a token has no explicit permission list (the API default). */
const ALL_PERMISSIONS = 'all';

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit' | 'refresh' | 'delete'; token: Token }
  | null;

function TokenValue({ value }: { value: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={`${styles.info} ${styles.success} d-block`}
      data-testid="token-value"
    >
      <p className="mb-1">{t('userSettings.tokens.valueNotice')}</p>
      <div className="d-flex gap-2 align-items-center">
        <code className={styles.tokenValue}>{value}</code>
        <Button
          size="sm"
          variant="outline-success"
          disabled={copied}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              // clipboard unavailable: the value stays selectable
            }
          }}
        >
          {copied
            ? t('userSettings.tokens.copied')
            : t('userSettings.tokens.copy')}
        </Button>
      </div>
    </div>
  );
}

function ExpirySelect({
  value,
  onChange,
  leaveUnchanged
}: {
  value: ExpiryKey | '';
  onChange: (key: ExpiryKey | '') => void;
  leaveUnchanged?: boolean;
}) {
  const t = useT();

  return (
    <Form.Select
      aria-label={t('userSettings.tokens.expiresIn')}
      value={value}
      onChange={event => onChange(event.target.value as ExpiryKey | '')}
    >
      {leaveUnchanged ? (
        <option value="">{t('userSettings.tokens.unchanged')}</option>
      ) : null}
      {EXPIRY_KEYS.map(key => (
        <option key={key} value={key}>
          {t(`userSettings.tokens.expiry.${key}`)}
        </option>
      ))}
    </Form.Select>
  );
}

function TokenDialog({
  dialog,
  onClose,
  existingNames
}: {
  dialog: NonNullable<Dialog>;
  onClose: () => void;
  existingNames: string[];
}) {
  const t = useT();
  const mutations = useTokenMutations();
  const token = dialog.kind === 'create' ? null : dialog.token;
  const [name, setName] = useState(token?.name ?? '');
  const [description, setDescription] = useState(token?.description ?? '');
  const [expiry, setExpiry] = useState<ExpiryKey | ''>(
    dialog.kind === 'create' ? 'day1' : ''
  );
  const initialPermission =
    token?.options?.permission ?? (token ? ALL_PERMISSIONS : 'read');
  const [permission, setPermission] = useState<string>(initialPermission);
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Token | null>(null);

  const nameTaken = existingNames.includes(name) && name !== token?.name;
  const busy = Object.values(mutations).some(m => m.isPending);

  const run = async () => {
    setError(null);
    try {
      if (dialog.kind === 'create') {
        setCreated(
          await mutations.create.mutateAsync({
            name,
            description,
            expiresAt: expiresAt(expiry || 'day1'),
            options: { permission }
          })
        );
      } else if (dialog.kind === 'edit') {
        await mutations.update.mutateAsync({
          id: dialog.token.id,
          name,
          description,
          ...(expiry ? { expiresAt: expiresAt(expiry) } : {}),
          // The API merges options: an untouched permission is left as it is.
          ...(permission !== initialPermission
            ? { options: { permission } }
            : {})
        });
        onClose();
      } else if (dialog.kind === 'refresh') {
        setCreated(
          await mutations.refreshValue.mutateAsync({
            id: dialog.token.id,
            ...(expiry ? { expiresAt: expiresAt(expiry) } : {})
          })
        );
      } else {
        await mutations.remove.mutateAsync(dialog.token.id);
        onClose();
      }
    } catch (e) {
      setError(
        e instanceof Error &&
          e.message &&
          !e.message.startsWith('Request failed')
          ? e.message
          : t('common.error')
      );
    }
  };

  const titleKey = `userSettings.tokens.dialog.${dialog.kind}`;
  const submitDisabled =
    busy ||
    created !== null ||
    (dialog.kind === 'create' && (!name.trim() || nameTaken)) ||
    (dialog.kind === 'edit' && (!name.trim() || nameTaken)) ||
    (dialog.kind === 'delete' && confirmName !== token?.name);

  // A new or rotated value is shown only once, in this dialog: it must not close mid-request.
  const close = () => {
    if (!busy) {
      onClose();
    }
  };

  return (
    <Modal
      className={styles.modal}
      show
      onHide={close}
      backdrop={busy ? 'static' : true}
      keyboard={!busy}
      aria-labelledby="token-dialog-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="token-dialog-title">{t(titleKey)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? (
          <div className={`${styles.info} ${styles.warning}`} role="alert">
            {error}
          </div>
        ) : null}
        {created?.value ? <TokenValue value={created.value} /> : null}
        {dialog.kind === 'create' || dialog.kind === 'edit' ? (
          <>
            <Form.Group className={styles.fieldRow} controlId="token-name">
              <Form.Label>{t('userSettings.tokens.name')}</Form.Label>
              <Form.Control
                value={name}
                disabled={created !== null}
                isInvalid={nameTaken}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
              {nameTaken ? (
                <Form.Control.Feedback type="invalid">
                  {t('userSettings.tokens.nameTaken')}
                </Form.Control.Feedback>
              ) : null}
            </Form.Group>
            <Form.Group
              className={styles.fieldRow}
              controlId="token-description"
            >
              <Form.Label>{t('userSettings.tokens.description')}</Form.Label>
              <Form.Control
                value={description}
                disabled={created !== null}
                placeholder={t('userSettings.tokens.optional')}
                onChange={e => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className={styles.fieldRow}>
              <Form.Label>{t('userSettings.tokens.expiresIn')}</Form.Label>
              <ExpirySelect
                value={expiry}
                onChange={setExpiry}
                leaveUnchanged={dialog.kind === 'edit'}
              />
            </Form.Group>
            <Form.Group
              className={styles.fieldRow}
              controlId="token-permission"
            >
              <Form.Label>{t('userSettings.tokens.permission')}</Form.Label>
              <Form.Select
                value={permission}
                disabled={created !== null}
                onChange={e => setPermission(e.target.value)}
              >
                {PERMISSIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </>
        ) : null}
        {dialog.kind === 'refresh' && !created ? (
          <>
            <p>
              {t('userSettings.tokens.refreshWarning', {
                name: dialog.token.name
              })}
            </p>
            <Form.Group>
              <Form.Label>{t('userSettings.tokens.expiresIn')}</Form.Label>
              <ExpirySelect
                value={expiry}
                onChange={setExpiry}
                leaveUnchanged
              />
            </Form.Group>
          </>
        ) : null}
        {dialog.kind === 'delete' ? (
          <>
            <p className={styles.warningText}>
              {t('userSettings.tokens.deleteWarning', {
                name: dialog.token.name
              })}
            </p>
            <Form.Control
              aria-label={t('userSettings.tokens.confirmName')}
              placeholder={dialog.token.name}
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
            />
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          {created ? t('userSettings.tokens.close') : t('userSettings.cancel')}
        </Button>
        <Button
          variant={dialog.kind === 'delete' ? 'danger' : 'primary'}
          disabled={submitDisabled}
          onClick={run}
        >
          {t(`userSettings.tokens.submit.${dialog.kind}`)}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

type SortKey = 'name' | 'description' | 'expiresAt' | 'permission' | 'lastUsed';

const sortValue = (token: Token, key: SortKey): string =>
  key === 'permission'
    ? (token.options?.permission ?? ALL_PERMISSIONS)
    : String(token[key] ?? '');

export function TokensPage() {
  const t = useT();
  const { locale } = useLocale();
  const relative = useFormatRelative();
  const { data: tokens, isPending, isError } = useTokens();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: 'name',
    dir: 1
  });
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0] ?? 10);
  const [page, setPage] = useState(1);

  const date = (iso?: string | null) =>
    iso
      ? new Intl.DateTimeFormat(locale === 'en-XA' ? 'en' : locale, {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(new Date(iso))
      : undefined;

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();

    return (tokens ?? [])
      .filter(
        token =>
          !query ||
          token.name.toLowerCase().includes(query) ||
          (token.description ?? '').toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const x = sortValue(a, sort.key);
        const y = sortValue(b, sort.key);

        // tokens without a value (no expiry, never used) sort last either way
        if (!x || !y) {
          return x ? -1 : y ? 1 : 0;
        }

        return sort.dir * x.localeCompare(y);
      });
  }, [tokens, filter, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * pageSize, current * pageSize);

  const header = (key: SortKey, label: string) => (
    <th
      aria-sort={
        sort.key === key
          ? sort.dir === 1
            ? 'ascending'
            : 'descending'
          : undefined
      }
    >
      <button
        type="button"
        className="jobs-sort"
        onClick={() => {
          setSort(s => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : 1 }));
          setPage(1);
        }}
      >
        {label}
        <Icon
          name={
            sort.key !== key ? 'sort' : sort.dir === 1 ? 'sortUp' : 'sortDown'
          }
        />
      </button>
    </th>
  );

  return (
    <section aria-label={t('userSettings.tab.tokens')}>
      <div className={styles.tokensHeader}>
        <div>
          <h2 className={styles.tokensTitle}>{t('userSettings.tab.tokens')}</h2>
          <p className={`${styles.tokensExplanation} mb-0`}>
            {t('userSettings.tokens.intro')}{' '}
            <a
              href="https://docs.screwdriver.cd/user-guide/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('userSettings.tokens.apiDocs')}
            </a>
          </p>
        </div>
        <div className={styles.newToken}>
          <Button
            disabled={isPending || isError}
            onClick={() => setDialog({ kind: 'create' })}
          >
            {t('userSettings.tokens.new')}
          </Button>
        </div>
      </div>
      {isError ? (
        <div className={`${styles.info} ${styles.warning}`} role="alert">
          {t('common.error')}
        </div>
      ) : null}
      {tokens && tokens.length > 0 ? (
        <div className={styles.tokensFilter}>
          <FilterInput
            value={filter}
            onChange={value => {
              setFilter(value);
              setPage(1);
            }}
            label={t('userSettings.tokens.filter')}
            clearLabel={t('userSettings.tokens.clearFilter')}
          />
        </div>
      ) : null}
      <div className={styles.tokensTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              {header('name', t('userSettings.tokens.name'))}
              {header('description', t('userSettings.tokens.description'))}
              {header('expiresAt', t('userSettings.tokens.expires'))}
              {header('permission', t('userSettings.tokens.permission'))}
              {header('lastUsed', t('userSettings.tokens.lastUsed'))}
              <th>{t('userSettings.tokens.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(token => {
              const expired = token.expiresAt
                ? new Date(token.expiresAt) < new Date()
                : false;

              return (
                <tr key={token.id}>
                  <td>{token.name}</td>
                  <td>{token.description}</td>
                  <td
                    className={expired ? 'text-danger' : undefined}
                    title={date(token.expiresAt)}
                  >
                    {!token.expiresAt
                      ? t('userSettings.tokens.noExpiration')
                      : expired
                        ? t('userSettings.tokens.expired')
                        : relative(token.expiresAt)}
                  </td>
                  <td>{token.options?.permission ?? ALL_PERMISSIONS}</td>
                  <td title={date(token.lastUsed)}>
                    {token.lastUsed
                      ? relative(token.lastUsed)
                      : t('userSettings.tokens.neverUsed')}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => setDialog({ kind: 'edit', token })}
                        aria-label={t('userSettings.tokens.editAria', {
                          name: token.name
                        })}
                      >
                        {t('userSettings.tokens.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => setDialog({ kind: 'refresh', token })}
                        aria-label={t('userSettings.tokens.refreshAria', {
                          name: token.name
                        })}
                      >
                        {t('userSettings.tokens.refresh')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setDialog({ kind: 'delete', token })}
                        aria-label={t('userSettings.tokens.deleteAria', {
                          name: token.name
                        })}
                      >
                        {t('userSettings.tokens.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > pageSize ? (
        <TableFooter
          first={(current - 1) * pageSize + 1}
          last={Math.min(current * pageSize, filtered.length)}
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
      ) : null}
      {tokens && tokens.length === 0 ? (
        <p className="px-3" style={{ color: '#979ba7' }}>
          {t('userSettings.tokens.none')}
        </p>
      ) : null}
      {dialog ? (
        <TokenDialog
          key={dialog.kind + ('token' in dialog ? dialog.token.id : '')}
          dialog={dialog}
          onClose={() => setDialog(null)}
          existingNames={(tokens ?? []).map(token => token.name)}
        />
      ) : null}
    </section>
  );
}
