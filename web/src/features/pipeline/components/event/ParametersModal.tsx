import { Button, Modal, Table } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import type { SdEvent } from '../../types';

/** Pipeline-level parameters are `{name: {value}}`; job-level ones nest one level deeper. */
export function ParametersModal({
  event,
  onClose
}: {
  event: SdEvent;
  onClose: () => void;
}) {
  const t = useT();
  const rows: Array<{ scope: string; name: string; value: string }> = [];

  Object.entries(event.meta?.parameters ?? {}).forEach(([name, raw]) => {
    const entry = raw as { value?: unknown } & Record<
      string,
      { value?: unknown }
    >;

    if (entry && typeof entry === 'object' && 'value' in entry) {
      rows.push({
        scope: t('pipeline.parameters.pipeline'),
        name,
        value: String(entry.value)
      });
    } else if (entry && typeof entry === 'object') {
      Object.entries(entry).forEach(([param, v]) =>
        rows.push({
          scope: name,
          name: param,
          value: String((v as { value?: unknown })?.value ?? '')
        })
      );
    }
  });

  return (
    <Modal show onHide={onClose} centered className="pipeline-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5">
          {t('pipeline.parameters.title', { id: event.id })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table size="sm">
          <thead>
            <tr>
              <th>{t('pipeline.parameters.scope')}</th>
              <th>{t('pipeline.parameters.name')}</th>
              <th>{t('pipeline.parameters.value')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={`${row.scope}/${row.name}`}>
                <td>{row.scope}</td>
                <td>{row.name}</td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          {t('pipeline.common.close')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
