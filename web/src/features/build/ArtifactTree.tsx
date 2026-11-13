import { Icon } from '~/components/Icon';
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useT } from '~/i18n/useT';
import { encodeArtifactPath } from './api';
import type { ArtifactNode } from './types';

interface Props {
  nodes: ArtifactNode[];
  pipelineId: string;
  buildId: string;
  selected: string;
}

function Branch({ nodes, pipelineId, buildId, selected }: Props) {
  return (
    <ul className="artifact-tree__list">
      {nodes.map(node => (
        <Node key={node.path} node={node} pipelineId={pipelineId} buildId={buildId} selected={selected} />
      ))}
    </ul>
  );
}

function Node({ node, pipelineId, buildId, selected }: Omit<Props, 'nodes'> & { node: ArtifactNode }) {
  // Directories on the way to the selected artifact start expanded.
  const dirPath = `${node.path}/`;
  const [open, setOpen] = useState(selected.startsWith(dirPath));
  const navigate = useNavigate();

  if (node.type === 'file') {
    return (
      <li className={selected === node.path ? 'artifact-tree__file is-selected' : 'artifact-tree__file'}>
        <Link to={`/pipelines/${pipelineId}/builds/${buildId}/artifacts/${encodeArtifactPath(node.path)}`}><Icon name="file" /> {node.text}</Link>
      </li>
    );
  }

  return (
    <li className="artifact-tree__dir">
      <button
        type="button"
        className={selected === dirPath ? 'btn btn-link btn-sm p-0 fw-bold' : 'btn btn-link btn-sm p-0'}
        aria-expanded={open} onClick={() => {
          // Selecting the directory (trailing slash, as the preview expects) makes its download action reachable.
          setOpen(o => !o);
          void navigate({ to: `/pipelines/${pipelineId}/builds/${buildId}/artifacts/${encodeArtifactPath(dirPath)}` });
        }}
      >
        <Icon name={open ? 'folderOpen' : 'folder'} /> {node.text}
      </button>
      {open ? <Branch nodes={node.children} pipelineId={pipelineId} buildId={buildId} selected={selected} /> : null}
    </li>
  );
}

export function ArtifactTree({
  nodes,
  loading,
  error,
  ...rest
}: Props & { loading: boolean; error: boolean }) {
  const t = useT();

  return (
    <div className="artifact-tree">
      <h4>
        <Link to={`/pipelines/${rest.pipelineId}/builds/${rest.buildId}/artifacts`} search={{ root: 1 }}>{t('build.artifacts.title')}</Link>
      </h4>
      {loading ? (
        <span>{t('common.loading')}</span>
      ) : error ? (
        <span className="artifact-error">{t('build.artifacts.failed')}</span>
      ) : nodes.length === 0 ? (
        <span>{t('build.artifacts.none')}</span>
      ) : (
        <Branch nodes={nodes} {...rest} />
      )}
    </div>
  );
}
