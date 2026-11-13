import { Icon } from '~/components/Icon';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useT } from '~/i18n/useT';
import {
  createToken,
  deleteToken,
  refreshToken,
  updateToken,
  type TokenBody
} from '../api/mutations';
import { keys, useTokens } from '../api/queries';
import { ConfirmModal } from '../components/ConfirmModal';
import { usePipeline } from '../components/PipelineContext';
import { SecretsTabs } from '../components/SecretsTabs';
import {
  EXPIRY_KEYS,
  expiresAt,
  PERMISSIONS,
  type ExpiryKey
} from '~/features/user-settings/lib/tokens';
import { useFormatDateTime, useFormatRelative } from '../hooks/useFormat';
import type { Token } from '../types';

/** Shown when a token has no explicit permission (the API default), as in Ember's tokens table. */
const ALL_PERMISSIONS = 'all';

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; token: Token }
  | { kind: 'refresh'; token: Token }
  | { kind: 'delete'; token: Token }
  | { kind: 'value'; token: Token }
  | null;

const isExpired = (token: Token, now = Date.now()) =>
  Boolean(token.expiresAt) && new Date(token.expiresAt as string).getTime() < now;

/** The one-time token value with a copy button (Ember tokens/modal/create and refresh). */
function TokenValue({ value }: { value: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  return (
    <Alert variant="success" className="mb-0">
      <p className="mb-2">
        <Icon name="circleCheck" /> {t('pipeline.tokens.valueBody')}
      </p>
      <div className="d-flex gap-2 align-items-center">
        <code id="token-value" className="text-break">
          {value}
        </code>
        <Button
          size="sm"
          variant="outline-success"
          id="copy-token"
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
          {copied ? t('pipeline.tokens.copied') : t('pipeline.tokens.copy')}
        </Button>
      </div>
    </Alert>
  );
}

export function TokensPage() {
  const t = useT();
  const { pipeline } = usePipeline();
  const queryClient = useQueryClient();
  const tokens = useTokens(pipeline.id);
  const format = useFormatDateTime();
  const relative = useFormatRelative();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState<ExpiryKey | ''>('');
  const [permission, setPermission] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: keys.tokens(pipeline.id) });
  const open = (next: Dialog) => {
    setName(next?.kind === 'edit' ? next.token.name : '');
    setDescription(next?.kind === 'edit' ? next.token.description ?? '' : '');
    // Ember: a new token defaults to "1 day" and "read"; edit/refresh leave both unchanged.
    setExpiry(next?.kind === 'create' ? 'day1' : '');
    setPermission(next?.kind === 'create' ? 'read' : '');
    setConfirmName('');
    setDialog(next);
  };
  const otherNames = (tokens.data ?? [])
    .filter(tk => dialog?.kind !== 'edit' || tk.id !== dialog.token.id)
    .map(tk => tk.name);
  const nameTaken = otherNames.includes(name.trim());

  return (
    <ScrollRegion>
      <div className="pipeline-page pipeline-tokens">
        <SecretsTabs active="tokens" />
        {tokens.isError ? (
          <Alert variant="danger">{t('common.error')}</Alert>
        ) : null}
        <div className="d-flex justify-content-between mb-2">
          <h2 className="h6">{t('pipeline.tokens.title')}</h2>
          <Button
            size="sm"
            id="add-token"
            onClick={() => open({ kind: 'create' })}
          >
            <Icon name="plus" /> {t('pipeline.tokens.add')}
          </Button>
        </div>
        <table className="table table-sm" id="tokens-table">
          <thead>
            <tr>
              <th>{t('pipeline.tokens.name')}</th>
              <th>{t('pipeline.tokens.description')}</th>
              <th>{t('pipeline.tokens.expires')}</th>
              <th>{t('pipeline.tokens.permission')}</th>
              <th>{t('pipeline.tokens.lastUsed')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(tokens.data ?? []).map(token => (
              <tr key={token.id} data-token={token.name}>
                <td>{token.name}</td>
                <td>{token.description}</td>
                <td
                  className={
                    isExpired(token) ? 'expires-column text-danger' : 'expires-column'
                  }
                  title={token.expiresAt ? format(token.expiresAt) : undefined}
                >
                  {!token.expiresAt
                    ? t('pipeline.tokens.noExpiry')
                    : isExpired(token)
                    ? t('pipeline.tokens.expired')
                    : relative(token.expiresAt)}
                </td>
                <td className="permission-column">
                  {token.options?.permission || ALL_PERMISSIONS}
                </td>
                <td
                  className="last-used-column"
                  title={token.lastUsed ? format(token.lastUsed) : undefined}
                >
                  {token.lastUsed
                    ? relative(token.lastUsed)
                    : t('pipeline.tokens.never')}
                </td>
                <td className="text-end">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="me-1"
                    onClick={() => open({ kind: 'edit', token })}
                  >
                    <Icon name="pen" /> {t('pipeline.common.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="me-1"
                    onClick={() => open({ kind: 'refresh', token })}
                  >
                    <Icon name="rotate" /> {t('pipeline.tokens.refresh')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => open({ kind: 'delete', token })}
                  >
                    <Icon name="trash" /> {t('pipeline.common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
            {tokens.data && tokens.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  {t('pipeline.tokens.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {dialog?.kind === 'create' || dialog?.kind === 'edit' ? (
          <ConfirmModal
            id="token-modal"
            title={
              dialog.kind === 'create'
                ? t('pipeline.tokens.add')
                : t('pipeline.tokens.editTitle', { name: dialog.token.name })
            }
            confirmLabel={t('pipeline.common.save')}
            disabled={!name.trim() || nameTaken}
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              if (dialog.kind === 'create') {
                const created = await createToken(pipeline.id, {
                  name,
                  description,
                  expiresAt: expiresAt(expiry || 'day1'),
                  options: { permission: permission || 'read' }
                });

                await refresh();
                setDialog({ kind: 'value', token: created });
              } else {
                const body: Partial<TokenBody> = { name, description };

                if (expiry) {
                  body.expiresAt = expiresAt(expiry);
                }
                if (permission) {
                  body.options = { permission };
                }
                await updateToken(pipeline.id, dialog.token.id, body);
                await refresh();
                setDialog(null);
              }
            }}
          >
            <Form.Group className="mb-2">
              <Form.Label htmlFor="token-name">
                {t('pipeline.tokens.name')}
              </Form.Label>
              <Form.Control
                id="token-name"
                value={name}
                isInvalid={nameTaken}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                {t('pipeline.tokens.nameTaken')}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="token-description">
                {t('pipeline.tokens.description')}
              </Form.Label>
              <Form.Control
                id="token-description"
                value={description}
                placeholder={t('pipeline.tokens.optional')}
                onChange={e => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label htmlFor="token-expiry">
                {t('pipeline.tokens.expiresIn')}
              </Form.Label>
              {dialog.kind === 'edit' ? (
                <div className="small text-muted" id="token-current-expiry">
                  {t('pipeline.tokens.current', {
                    value: dialog.token.expiresAt
                      ? format(dialog.token.expiresAt)
                      : t('pipeline.tokens.noExpiry')
                  })}
                </div>
              ) : null}
              <Form.Select
                id="token-expiry"
                value={expiry}
                onChange={e => setExpiry(e.target.value as ExpiryKey | '')}
              >
                {dialog.kind === 'edit' ? (
                  <option value="">{t('pipeline.tokens.unchanged')}</option>
                ) : null}
                {EXPIRY_KEYS.map(key => (
                  <option key={key} value={key}>
                    {t(`pipeline.tokens.expiry.${key}`)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="token-permission">
                {t('pipeline.tokens.permission')}
              </Form.Label>
              {dialog.kind === 'edit' ? (
                <div className="small text-muted" id="token-current-permission">
                  {t('pipeline.tokens.current', {
                    value: dialog.token.options?.permission || ALL_PERMISSIONS
                  })}
                </div>
              ) : null}
              <Form.Select
                id="token-permission"
                value={permission}
                onChange={e => setPermission(e.target.value)}
              >
                {dialog.kind === 'edit' ? (
                  <option value="">{t('pipeline.tokens.unchanged')}</option>
                ) : null}
                {PERMISSIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </ConfirmModal>
        ) : null}
        {dialog?.kind === 'refresh' ? (
          <ConfirmModal
            title={t('pipeline.tokens.refreshTitle', {
              name: dialog.token.name
            })}
            confirmLabel={t('pipeline.tokens.refresh')}
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              const next = await refreshToken(
                pipeline.id,
                dialog.token.id,
                expiry ? { expiresAt: expiresAt(expiry) } : {}
              );

              await refresh();
              setDialog({ kind: 'value', token: next });
            }}
          >
            <p>{t('pipeline.tokens.refreshBody')}</p>
            <Form.Group>
              <Form.Label htmlFor="token-expiry">
                {t('pipeline.tokens.expiresIn')}
              </Form.Label>
              <Form.Select
                id="token-expiry"
                value={expiry}
                onChange={e => setExpiry(e.target.value as ExpiryKey | '')}
              >
                <option value="">{t('pipeline.tokens.unchanged')}</option>
                {EXPIRY_KEYS.map(key => (
                  <option key={key} value={key}>
                    {t(`pipeline.tokens.expiry.${key}`)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </ConfirmModal>
        ) : null}
        {dialog?.kind === 'delete' ? (
          <ConfirmModal
            title={t('pipeline.tokens.deleteTitle', {
              name: dialog.token.name
            })}
            confirmLabel={t('pipeline.common.delete')}
            variant="danger"
            disabled={confirmName !== dialog.token.name}
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              await deleteToken(pipeline.id, dialog.token.id);
              await refresh();
              setDialog(null);
            }}
          >
            <p>{t('pipeline.tokens.deleteBody')}</p>
            <Form.Group>
              <Form.Label htmlFor="token-confirm-name">
                {t('pipeline.tokens.confirmName', { name: dialog.token.name })}
              </Form.Label>
              <Form.Control
                id="token-confirm-name"
                value={confirmName}
                placeholder={dialog.token.name}
                onChange={e => setConfirmName(e.target.value)}
                autoFocus
              />
            </Form.Group>
          </ConfirmModal>
        ) : null}
        {dialog?.kind === 'value' ? (
          <ConfirmModal
            id="token-value-modal"
            title={t('pipeline.tokens.valueTitle')}
            confirmLabel={t('pipeline.common.done')}
            onClose={() => setDialog(null)}
            onConfirm={async () => setDialog(null)}
          >
            {dialog.token.value ? (
              <TokenValue value={dialog.token.value} />
            ) : null}
          </ConfirmModal>
        ) : null}
      </div>
    </ScrollRegion>
  );
}
