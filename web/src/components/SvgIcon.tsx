import { assetUrl } from '~/config/config';

/** The Ember UI's svg-jar icons (public/assets/svg/<name>.svg), coloured by CSS `color`. */
export function SvgIcon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const url = `url(${assetUrl(`/assets/svg/${name}.svg`)})`;

  return (
    <span
      className={`sd-svg-icon ${className}`.trim()}
      aria-hidden="true"
      style={{ width: size, height: size, maskImage: url, WebkitMaskImage: url }}
    />
  );
}
