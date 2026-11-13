import { assetUrl } from '~/config/config';

/** The shield the Ember UI shows for trusted templates and commands (public/assets/svg/trusted.svg), coloured by CSS. */
export function TrustedIcon({ trusted = true }: { trusted?: boolean }) {
  return (
    <span
      className={`sd-trusted${trusted ? '' : ' distrusted'}`}
      aria-hidden="true"
      style={{ maskImage: `url(${assetUrl('/assets/svg/trusted.svg')})`, WebkitMaskImage: `url(${assetUrl('/assets/svg/trusted.svg')})` }}
    />
  );
}
