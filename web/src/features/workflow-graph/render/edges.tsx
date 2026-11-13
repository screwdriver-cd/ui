import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { memo } from 'react';
import type { FlowEdge } from './flow';

const CORNER = 6;

/** SVG path through the ELK-routed orthogonal polyline with small rounded corners. */
export function polylinePath(
  points: ReadonlyArray<{ x: number; y: number }>,
  radius = CORNER
): string {
  if (points.length < 2) return '';

  let d = `M ${points[0]?.x} ${points[0]?.y}`;

  for (let i = 1; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] as { x: number; y: number };
    const p = points[i] as { x: number; y: number };
    const p1 = points[i + 1] as { x: number; y: number };
    const inLen = Math.hypot(p.x - p0.x, p.y - p0.y);
    const outLen = Math.hypot(p1.x - p.x, p1.y - p.y);
    const r = Math.min(radius, inLen / 2, outLen / 2);

    if (r < 0.5) {
      d += ` L ${p.x} ${p.y}`;
    } else {
      d += ` L ${p.x + ((p0.x - p.x) / inLen) * r} ${
        p.y + ((p0.y - p.y) / inLen) * r
      }`;
      d += ` Q ${p.x} ${p.y} ${p.x + ((p1.x - p.x) / outLen) * r} ${
        p.y + ((p1.y - p.y) / outLen) * r
      }`;
    }
  }

  const last = points[points.length - 1];

  return `${d} L ${last?.x} ${last?.y}`;
}

/**
 * Draws the route ELK computed (no re-routing in the browser, so edges never detour differently from
 * the layout that spaced the nodes). Falls back to a smooth step between the handles without a route.
 */
export const ElkEdge = memo(function ElkEdge(props: EdgeProps<FlowEdge>) {
  const {
    id,
    data,
    markerEnd,
    style,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  } = props;
  const points = data?.points;
  const path =
    points && points.length >= 2
      ? polylinePath(points)
      : getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition
        })[0];

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
});

export const edgeTypes = { elk: ElkEdge };
