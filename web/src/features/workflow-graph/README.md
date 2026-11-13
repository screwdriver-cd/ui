# workflow-graph

Pipeline workflow graph: model, decoration (Ember `graph-tools` port), build-flow lens, ELK layout (Web Worker) and React Flow rendering.

```tsx
import { WorkflowGraph } from '~/features/workflow-graph';

<div style={{ height: 600 }}>
  <WorkflowGraph
    graph={event.workflowGraph}
    builds={builds}
    stageBuilds={stageBuilds}
    jobs={jobs}
    stages={stages}
    start={event.startFrom}
    selectedJobId={jobId}
    onSelectJob={node => navigate(node?.jobId)}
    onJobAction={action => { /* perform API call or navigate */ }}
  />
</div>
```

The component fills its parent: give the parent an explicit height.

## Props (`WorkflowGraphProps`, see `render/types.ts`)

| Prop | Type | Notes |
| --- | --- | --- |
| `graph` | `{nodes, edges}` | Required. API `workflowGraph`. Edges to missing nodes are dropped and logged. |
| `builds` | `BuildLite[]` | Needs `id, jobId, status`; `parentBuildId` (number or array for joins) drives the lens. |
| `stageBuilds`, `jobs`, `stages` | arrays | Optional. Without `stages`, stage nodes render as plain jobs. |
| `start` | string | Event start node (`~commit`, `~pr`, `~commit:branch`). |
| `chainPR`, `prNum` | boolean, number | PR event behaviour. |
| `activeTab` | `'events' \| 'pulls'` | `pulls` restricts starting to jobs reachable from `~pr`. |
| `downstreamTriggers` | `DownstreamTrigger[]` | Adds `~sd-<job>-triggers` nodes. |
| `selectedJobId` | number or string or null | Pins the lens and centres the view. |
| `onSelectJob` | `(WorkflowNodeInfo \| null) => void` | Fired on node click. |
| `onJobAction` | `(JobAction) => void` | Fired from the popover. The host does the API call. |
| `readOnly` | boolean | Hides start, restart, stop. |
| `collapsedStages`, `onCollapsedStagesChange` | `ReadonlySet`, callback | Controlled; omit for internal state. |
| `showLabels`, `onShowLabelsChange` | boolean, callback | Controlled; omit for internal state. |
| `variant` | `'full' \| 'mini'` | `mini`: static event-card thumbnail. Same model, decoration and layout (compact scale, hierarchical stages), status-filled blocks, no labels, toolbar, minimap, handlers or focusable nodes. Give it a small explicit size (e.g. 360x90). |
| `minimap` | boolean | Default: on above 30 nodes. |
| `className` | string | |

## Actions (`JobAction`)

`view-build`, `start`, `restart`, `stop` (each with `node: WorkflowNodeInfo`; `stop` is not offered for a `CREATED` build, i.e. a job waiting on a join: `PUT /builds/:id` refuses CREATED builds with a 403, and stopping the event aborts them, as in Ember), `toggle-job` (enable/disable; the host asks for a reason), `view-metrics`, `start-stage` (`stage: WorkflowStageInfo`, `action: 'restart'` inherits the event / `'start'` is a fresh run), `open-external` (`pipelineId`, `jobName?`). `stop` also covers a `FROZEN` build.

## Behaviour

- Hover a node to highlight its lens; click to pin (chip with Unpin). The lens shows the upstream route actually taken (via `parentBuildId`, inferred when missing), downstream grouped by running, queued, waiting on join and will not run, and progress counts.
- AND joins (two or more `join: true` edges) and OR joins get badges.
- Toolbar: search, label toggle, fit view, jump to active, collapse or expand stages. Minimap for large graphs.
- Icons come from the screwdriver icon font (`public/assets/screwdriver.woff|ttf`, same code points as `STATUS_MAP` in `d3-graph-util.js`), declared in `workflow-graph.css` with same-origin URLs only (CSP `font-src 'self'`).
- Layout is one hierarchical ELK pass (`INCLUDE_CHILDREN`): expanded stages are compound nodes, so ELK sizes the stage box and routes inner edges; edges crossing a stage boundary attach to the stage box. Nodes of one layer are left-justified (`elk.alignment: LEFT`, set per node), and edges are drawn from the ELK-routed polyline (custom `elk` edge type), not re-routed by React Flow.
- Root rows (first layer) are stacked like Ember: `~pr`, `~commit`, other triggers (`~tag`, `~sd@...`, remote requires), then detached jobs and stages, each group in API order (`rootRank` in `layout/elk.ts`).
- `parentBuildId` is accepted as a number, array, numeric string or the comma string Ember produces for joins; missing, null or foreign (remote pipeline) parents fall back to inference (`upstream.inferred`).
- Layout runs in a Web Worker (main-thread fallback) and is keyed on structure and collapsed state only, so status updates never move nodes.

## Lower-level API

`index.ts` also exports `buildModel`, `decorateGraph`, `canJobStart`, `canStageStart`, `getFilteredGraph`, `createLensContext`, `lensFor`, `progressOf`, `activeNodes` and `computeLayout`, all pure and unit tested.

## i18n

Keys are `workflowGraph.*` in `locales/{en,ja}.json`, loaded by the existing glob.

## Testing notes

- Component tests call `mockReactFlowEnvironment()` from `render/testSetup.ts` (ResizeObserver, DOMMatrix, sizes) and use `fireEvent.click`; `user-event` pointer sequences crash d3-zoom in jsdom.
- If vitest serves stale transforms: `rm -rf node_modules/.vitest-cache node_modules/.vite/vitest`.

## Layout comparison and benchmarks

- `layout/crossings-budget.test.ts` gives every fixture graph, and a 4x24 stress graph, an absolute edge-crossing budget.
- `ember-parity/` holds the only unit tests that read the Ember app's source; delete the folder with Ember. `compare.test.ts` runs the legacy `app/utils/graph-tools.js` as-is (source loaded as text, Ember imports stubbed) and asserts the ELK layout has no more edge crossings than the legacy grid layout (straight lines between cells) and stays within 2.5x its canvas area. `icons.test.ts` checks the icon font code points against `STATUS_MAP` in `d3-graph-util.js`.
- `bench/` is a dev-only page (`/src/features/workflow-graph/bench/index.html?fixture=stages|collapsed|production|pr-chain|external|joins|stress|mini|only-detached&locale=en|ja`) used by `e2e/specs/graph-visual.spec.ts` (screenshots, en and ja) and `graph-perf.spec.ts` (layout time budgets). Both are opt-in: run them with `npm run test:graph` in `e2e/` (see `e2e/README.md`). The specs start `npx vite --host 127.0.0.1 --port 5201 --strictPort` themselves; set `E2E_GRAPH_URL` to reuse a server. Refresh baselines with `npm run test:visual:update` (baselines are per OS).
