import '@xyflow/react/dist/style.css';
import './workflow-graph.css';
import {
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent
} from 'react';
import { useT } from '~/i18n/useT';
import { decorateGraph } from '../decorate/decorate';
import { withDownstreamTriggers } from '../decorate/filter';
import { createTextMeasurer } from '../layout/measure';
import { toLayoutInput } from '../layout/input';
import {
  activeNodes,
  createLensContext,
  lensFor,
  progressOf,
  type FlowState
} from '../lens';
import { buildFlow, type FlowNode } from './flow';
import { GraphContext, type GraphContextValue } from './context';
import {
  LEGIBLE_ZOOM,
  fitZoom,
  focusViewport,
  layoutBounds,
  pickFocus
} from './initialFocus';
import { NodePopover } from './NodePopover';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes';
import { Toolbar } from './Toolbar';
import type { WorkflowGraphProps } from './types';
import { useLayout } from './useLayout';

const EMPTY_SET: ReadonlySet<string> = new Set();
const LARGE_GRAPH = 30;
const noop = () => {};

function useControllable<T>(
  value: T | undefined,
  initial: T,
  onChange?: (v: T) => void
): [T, (v: T) => void] {
  const [internal, setInternal] = useState<T>(initial);
  const current = value === undefined ? internal : value;

  return [
    current,
    v => {
      if (value === undefined) setInternal(v);
      onChange?.(v);
    }
  ];
}

function Inner(props: WorkflowGraphProps) {
  const {
    graph,
    builds,
    stageBuilds,
    jobs,
    stages,
    start,
    chainPR,
    prNum,
    eventId,
    activeTab = 'events',
    downstreamTriggers,
    highlightNodes,
    selectedJobId,
    selectedNode,
    onSelectJob,
    onJobAction,
    readOnly = false,
    popover: withPopover = true,
    variant = 'full',
    legibleZoom = LEGIBLE_ZOOM,
    className
  } = props;
  const t = useT();
  const mini = variant === 'mini';
  const { fitView, setViewport } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  const [collapsed, setCollapsed] = useControllable<ReadonlySet<string>>(
    props.collapsedStages,
    EMPTY_SET,
    next => props.onCollapsedStagesChange?.(new Set(next))
  );
  const [showLabelsPref, setShowLabels] = useControllable<boolean>(
    props.showLabels,
    true,
    props.onShowLabelsChange
  );
  const showLabels = mini ? false : showLabelsPref;

  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [popover, setPopover] = useState<{
    name: string;
    left: number;
    top: number;
  } | null>(null);
  // Another event in the same view (the rail, Back/Forward): the open popover would act on its builds.
  const [shownEvent, setShownEvent] = useState(eventId);

  if (shownEvent !== eventId) {
    setShownEvent(eventId);
    setPinned(null);
    setPopover(null);
  }
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<FlowState | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const effectiveGraph = useMemo(
    () => withDownstreamTriggers(graph, downstreamTriggers),
    [graph, downstreamTriggers]
  );
  const decorated = useMemo(
    () =>
      decorateGraph({
        graph: effectiveGraph,
        builds,
        stageBuilds,
        jobs,
        start,
        chainPR,
        prNum,
        stages,
        collapsedStages: collapsed
      }),
    [
      effectiveGraph,
      builds,
      stageBuilds,
      jobs,
      start,
      chainPR,
      prNum,
      stages,
      collapsed
    ]
  );

  const measure = useMemo(() => createTextMeasurer(), []);
  const layoutInput = useMemo(
    () => toLayoutInput(decorated, { measure, showLabels, compact: mini }),
    [decorated, measure, showLabels, mini]
  );
  const { layout } = useLayout(layoutInput);

  const lensCtx = useMemo(
    () =>
      createLensContext({
        nodes: decorated.nodes,
        edges: decorated.edges,
        builds: builds ?? []
      }),
    [decorated, builds]
  );
  const progress = useMemo(() => progressOf(lensCtx), [lensCtx]);
  const active = useMemo(() => activeNodes(lensCtx), [lensCtx]);

  const selectedName = useMemo(() => {
    if (selectedNode) {
      return decorated.nodes.some(n => n.name === selectedNode)
        ? selectedNode
        : null;
    }
    if (selectedJobId === undefined || selectedJobId === null) return null;

    return (
      decorated.nodes.find(
        n => n.id !== undefined && `${n.id}` === `${selectedJobId}`
      )?.name ?? null
    );
  }, [decorated, selectedJobId, selectedNode]);

  const focus = mini ? null : (hovered ?? pinned ?? selectedName);
  const lens = useMemo(
    () => (focus ? lensFor(lensCtx, focus) : null),
    [lensCtx, focus]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      if (!highlightNodes?.size) return null;

      const present = new Set(decorated.nodes.map(n => n.name));
      const kept = [...highlightNodes].filter(n => present.has(n));

      return kept.length ? new Set(kept) : null;
    }

    return new Set(
      decorated.nodes
        .filter(
          n =>
            n.name.toLowerCase().includes(q) ||
            String(n.displayName ?? '')
              .toLowerCase()
              .includes(q)
        )
        .map(n => n.name)
    );
  }, [decorated, query, highlightNodes]);

  const stateFilterNodes = useMemo(
    () => new Set(stateFilter ? progress.byState[stateFilter] : []),
    [progress, stateFilter]
  );

  const flow = useMemo(
    () =>
      layout
        ? buildFlow({
            decorated,
            graph: effectiveGraph,
            layout,
            lensCtx,
            lens,
            pinned: pinned ?? selectedName,
            activeTab,
            readOnly,
            showLabels,
            mini,
            matches,
            stateFilter,
            stateFilterNodes
          })
        : null,
    [
      layout,
      decorated,
      effectiveGraph,
      lensCtx,
      lens,
      pinned,
      selectedName,
      activeTab,
      readOnly,
      showLabels,
      mini,
      matches,
      stateFilter,
      stateFilterNodes
    ]
  );

  const centerOn = useCallback(
    (name: string, duration = 250) => {
      fitView({
        nodes: [{ id: name }],
        duration,
        maxZoom: 1.1,
        padding: 0.6
      });
    },
    [fitView]
  );

  // Where the graph first looks: the deepest active job, or where a finished event started.
  // Pipelines without an event (visualizer, validator) have nothing to focus on and just fit.
  const initialFocus = useMemo(() => {
    if (mini || (start === undefined && !builds?.length) || !layout)
      return null;

    const placed = new Map(layout.nodes.map(n => [n.id, n]));

    return pickFocus({
      model: lensCtx.model,
      states: lensCtx.states,
      start,
      startedFrom: decorated.nodes
        .filter(n => n.status === 'STARTED_FROM')
        .map(n => n.name),
      xOf: name => placed.get(name)?.x
    });
  }, [mini, start, builds, layout, lensCtx, decorated]);

  // Big graphs open at a legible zoom around the focus instead of shrinking to fit. Re-run when the
  // layout changes (structure, collapsed state, label mode; never status polls) until the user moves
  // the graph themselves, after which their viewport is kept.
  const layoutKeyRef = useRef<string | null>(null);
  const userMovedRef = useRef(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (!layout || layout.key === layoutKeyRef.current) return undefined;

    const first = layoutKeyRef.current === null;

    layoutKeyRef.current = layout.key;
    if (!first && userMovedRef.current) return undefined;

    const id = requestAnimationFrame(() => {
      const duration = first ? 0 : 200;
      const padding = mini ? 0.04 : 0.1;
      const pane = containerRef.current?.querySelector('.react-flow');
      const size = pane && {
        width: pane.clientWidth,
        height: pane.clientHeight
      };
      const bounds = layoutBounds(layout);
      const target = selectedName ?? initialFocus;
      const box = target ? layout.nodes.find(n => n.id === target) : undefined;

      if (first && selectedName) {
        centerOn(selectedName, 0);
      } else if (
        box &&
        size?.width &&
        size.height &&
        fitZoom(bounds, size, padding) < legibleZoom
      ) {
        void setViewport(focusViewport(bounds, box, size, legibleZoom), {
          duration
        });
      } else {
        void fitView({ padding, duration });
      }
      setPlaced(true);
    });

    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout?.key, fitView]);

  // Auto-centre on a job selected after the graph opened (the first selection is the initial focus).
  const selectedRef = useRef(selectedName);

  useEffect(() => {
    if (selectedName === selectedRef.current) return;
    selectedRef.current = selectedName;
    // A selection made outside the graph replaces the node pinned by an earlier click.
    setPinned(null);
    if (selectedName && layout) centerOn(selectedName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedName]);

  const nodeData = useCallback(
    (name: string) => flow?.nodes.find(n => n.id === name)?.data,
    [flow]
  );

  const ctxValue = useMemo<GraphContextValue>(
    () => ({
      interactive: !mini,
      onHover: setHovered,
      onActivate: (name, anchor) => {
        const data = nodeData(name);

        if (!data) return;

        setPinned(name);
        // The click already shows this node: a parent echoing it back as the selection must not
        // recentre the view under the pointer.
        selectedRef.current = name;
        onSelectJob?.(data.info ?? null);

        const box = containerRef.current?.getBoundingClientRect();
        const a = anchor?.getBoundingClientRect();
        const hasPopover = withPopover && data.kind !== 'trigger';

        setPopover(
          hasPopover && box && a
            ? { name, left: a.left - box.left, top: a.bottom - box.top + 6 }
            : hasPopover
              ? { name, left: 8, top: 48 }
              : null
        );
      },
      onToggleStage: stageName => {
        const next = new Set(collapsed);

        if (next.has(stageName)) next.delete(stageName);
        else next.add(stageName);
        setCollapsed(next);
        setPopover(null);
      }
    }),
    [mini, nodeData, onSelectJob, withPopover, collapsed, setCollapsed]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (mini) return;

    if (e.key === 'Escape') {
      setPinned(null);
      setPopover(null);

      return;
    }

    // Arrows in the toolbar's search box and filters move the caret or option, not the graph.
    if ((e.target as HTMLElement).closest('input, select, textarea')) return;

    const cur = pinned ?? selectedName ?? hovered;

    if (!cur || !lensCtx.model.hasNode(cur)) return;

    const next =
      e.key === 'ArrowRight'
        ? lensCtx.model.outNeighbors(cur)[0]
        : e.key === 'ArrowLeft'
          ? lensCtx.model.inNeighbors(cur)[0]
          : undefined;

    if (next) {
      e.preventDefault();
      setPinned(next);
      containerRef.current
        ?.querySelector<HTMLElement>(`[data-node="${CSS.escape(next)}"]`)
        ?.focus({ preventScroll: true });
      centerOn(next);
    }
  };

  const jump = () => {
    if (!active.length) return;

    // Start the cycle at the job the graph opened on, so the first press moves somewhere new.
    const from = initialFocus ? Math.max(0, active.indexOf(initialFocus)) : 0;
    const name = active[
      (from + activeIdx + (active[from] === initialFocus ? 1 : 0)) %
        active.length
    ] as string;

    setActiveIdx(activeIdx + 1);
    centerOn(name);
  };

  const popoverData = popover ? nodeData(popover.name) : undefined;
  const popoverNode = popover
    ? decorated.nodes.find(n => n.name === popover.name)
    : undefined;
  const nodeCount = decorated.nodes.length;
  const showMinimap = !mini && (props.minimap ?? nodeCount > LARGE_GRAPH);

  const lensSummary = lens && !mini ? lens.downstream : null;

  return (
    <GraphContext.Provider value={ctxValue}>
      <div
        ref={containerRef}
        className={`wg-root${mini ? ' wg-root--mini' : ''}${
          className ? ` ${className}` : ''
        }`}
        role="group"
        aria-label={t('workflowGraph.label')}
        onKeyDown={onKeyDown}
        data-testid="workflow-graph"
      >
        {!mini && (
          <Toolbar
            query={query}
            onQuery={setQuery}
            matchCount={matches?.size ?? null}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels(!showLabels)}
            onFit={() => fitView({ padding: 0.1, duration: 200 })}
            onJump={jump}
            canJump={active.length > 0}
            progress={progress}
            stateFilter={stateFilter}
            onStateFilter={setStateFilter}
            pinned={pinned}
            onUnpin={() => {
              setPinned(null);
              setPopover(null);
            }}
            lens={lens}
            lensSummary={lensSummary}
            event={builds !== undefined || start !== undefined}
          />
        )}
        {nodeCount === 0 ? (
          <div className="wg-empty">{t('workflowGraph.empty')}</div>
        ) : !flow ? (
          <div className="wg-empty" role="status">
            {t('workflowGraph.loading')}
          </div>
        ) : (
          <ReactFlow<FlowNode>
            nodes={flow.nodes}
            edges={flow.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            nodesFocusable={false}
            edgesFocusable={false}
            elementsSelectable={false}
            panOnDrag={!mini}
            zoomOnScroll={!mini}
            zoomOnPinch={!mini}
            zoomOnDoubleClick={false}
            preventScrolling={!mini}
            minZoom={0.1}
            maxZoom={mini ? 1 : 2}
            // placed by the effect above; hidden until then so the default viewport never flashes
            style={placed ? undefined : { visibility: 'hidden' }}
            onlyRenderVisibleElements={nodeCount > 250}
            // React Flow disables pointer events on nodes that have no handler of its own.
            onNodeClick={mini ? undefined : noop}
            onPaneClick={e => {
              if (!(e.target as HTMLElement).closest?.('.react-flow__node'))
                setPopover(null);
            }}
            onMoveStart={event => {
              // programmatic moves (fitView) and clicks must not dismiss the popover
              if (event && event.type !== 'click') setPopover(null);
              if (event) userMovedRef.current = true;
            }}
            proOptions={{ hideAttribution: mini }}
          >
            {showMinimap && (
              <MiniMap
                pannable
                zoomable
                ariaLabel={t('workflowGraph.label')}
                nodeColor={n =>
                  minimapColor(
                    (n.data as FlowNode['data'] | undefined)?.status,
                    (n.data as FlowNode['data'] | undefined)?.kind
                  )
                }
                nodeStrokeColor={n =>
                  (n.data as FlowNode['data'] | undefined)?.active
                    ? '#0b6bcb'
                    : 'transparent'
                }
                nodeStrokeWidth={6}
              />
            )}
          </ReactFlow>
        )}
        {popover && popoverData && (
          <NodePopover
            data={popoverData}
            triggers={popoverNode?.triggers}
            sha={props.sha}
            position={{ left: popover.left, top: popover.top }}
            onAction={a => onJobAction?.(a)}
            onClose={() => setPopover(null)}
          />
        )}
      </div>
    </GraphContext.Provider>
  );
}

function minimapColor(status?: string, kind?: string): string {
  if (kind === 'stage') return 'transparent';

  switch (status) {
    case 'SUCCESS':
      return '#2e9e5b';
    case 'FAILURE':
    case 'ABORTED':
      return '#d64545';
    case 'RUNNING':
      return '#0b6bcb';
    case 'QUEUED':
    case 'BLOCKED':
      return '#d9a100';
    default:
      return '#9aa3ad';
  }
}

/**
 * Workflow graph for an event or pipeline. See ../README.md for the props
 * contract. Give the parent an explicit height: the graph fills it.
 */
export function WorkflowGraph(props: WorkflowGraphProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
