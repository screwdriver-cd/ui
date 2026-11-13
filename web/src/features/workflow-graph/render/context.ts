import { createContext, useContext } from 'react';

export interface GraphContextValue {
  onHover: (name: string | null) => void;
  onActivate: (name: string, anchor: HTMLElement | null) => void;
  onToggleStage: (stageName: string) => void;
  interactive: boolean;
}

export const GraphContext = createContext<GraphContextValue>({
  onHover: () => {},
  onActivate: () => {},
  onToggleStage: () => {},
  interactive: true
});

export const useGraphContext = () => useContext(GraphContext);
