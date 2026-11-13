import type { HTMLAttributes } from 'react';

/**
 * The only way a screen scrolls vertically. `data-scroll-region` lets the
 * e2e no-page-scroll check tell intended inner scrolling from a leak.
 */
export function ScrollRegion({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-scroll-region="" className={`scroll-region ${className}`.trim()} {...rest} />;
}
