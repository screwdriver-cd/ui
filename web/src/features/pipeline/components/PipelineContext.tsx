import { createContext, useContext } from 'react';
import type { Pipeline } from '../types';

export interface PipelineContextValue {
  pipeline: Pipeline;
  pipelineId: number;
}

export const PipelineContext = createContext<PipelineContextValue | null>(null);

export function usePipeline(): PipelineContextValue {
  const value = useContext(PipelineContext);

  if (!value) {
    throw new Error('usePipeline must be used inside the pipeline layout');
  }

  return value;
}
