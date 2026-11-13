import type { ReactNode } from 'react';
import { ScrollRegion } from './ScrollRegion';

interface PageLayoutProps {
  /** Fixed content above the body (page title, tabs, toolbar). */
  header?: ReactNode;
  children: ReactNode;
  /** Set false when the body manages its own scrolling (e.g. a split view). */
  scroll?: boolean;
}

export function PageLayout({ header, children, scroll = true }: PageLayoutProps) {
  return (
    <div className="page-layout">
      {header ? <div className="page-layout__header">{header}</div> : null}
      {scroll ? <ScrollRegion>{children}</ScrollRegion> : <div className="scroll-region">{children}</div>}
    </div>
  );
}
