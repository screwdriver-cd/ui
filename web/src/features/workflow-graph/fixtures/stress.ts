import type { WorkflowGraphData } from '../types';

/**
 * Deterministic large pipeline: `stages` expanded stages of `perStage` jobs
 * chained after a fan-out of build jobs, plus joins and detached jobs.
 */
export function stressGraph(stages = 8, perStage = 36): { graph: WorkflowGraphData; stageMeta: Array<{ id: number; name: string }> } {
  const nodes: WorkflowGraphData['nodes'] = [{ name: '~commit' }, { name: '~pr' }];
  const edges: WorkflowGraphData['edges'] = [];
  let id = 1;

  const pre = ['lint', 'unit', 'build', 'package', 'publish'].map(name => ({ name, id: id++ }));

  nodes.push(...pre);
  edges.push({ src: '~commit', dest: 'lint' }, { src: '~pr', dest: 'lint' }, { src: '~commit', dest: 'unit' }, { src: 'lint', dest: 'build', join: true }, { src: 'unit', dest: 'build', join: true }, { src: 'build', dest: 'package' }, { src: 'package', dest: 'publish' });

  let prevTeardown = 'publish';
  const stageMeta: Array<{ id: number; name: string }> = [];

  for (let s = 0; s < stages; s += 1) {
    const stage = `region${s}`;
    const setup = `stage@${stage}:setup`;
    const teardown = `stage@${stage}:teardown`;

    stageMeta.push({ id: 100 + s, name: stage });
    nodes.push({ name: setup, id: id++, stageName: stage, virtual: true });
    edges.push({ src: prevTeardown, dest: setup });

    const jobs: string[] = [];

    for (let j = 0; j < perStage; j += 1) {
      const name = `${stage}-job-${j}`;

      jobs.push(name);
      nodes.push({ name, id: id++, stageName: stage });
      // two lanes with occasional cross links
      if (j < 3) edges.push({ src: setup, dest: name });
      else edges.push({ src: jobs[j - 3] as string, dest: name });
      if (j % 7 === 6) edges.push({ src: jobs[j - 5] as string, dest: name, join: true });
    }

    nodes.push({ name: teardown, id: id++, stageName: stage, virtual: true });
    jobs.slice(-3).forEach(j => edges.push({ src: j, dest: teardown }));
    prevTeardown = teardown;
  }

  for (let d = 0; d < 6; d += 1) {
    nodes.push({ name: `detached-${d}`, id: id++ });
    if (d % 2) edges.push({ src: `detached-${d - 1}`, dest: `detached-${d}` });
  }

  nodes.push({ name: 'sd@77:downstream' });
  edges.push({ src: 'publish', dest: 'sd@77:downstream' });

  return { graph: { nodes, edges }, stageMeta };
}
