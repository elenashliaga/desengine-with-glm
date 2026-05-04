export const ICON_BOX_SIZE = 16;

export const featureListStyle = 'feature-list m-0 p-0 list-none';

export const featureItemStyle = 'feature-item flex items-center leading-5 [&:not(:last-child)]:mb-2';

export const featureNameStyle = 'feature-name block text-left';

export const statusIconStyle = (isEnabled: boolean): string =>
  [
    'status-icon',
    isEnabled ? 'text-[#16a34a]' : 'text-black',
    `w-[${ICON_BOX_SIZE}px]`,
    `min-w-[${ICON_BOX_SIZE}px]`,
    `h-[${ICON_BOX_SIZE}px]`,
    'inline-flex',
    'items-center',
    'justify-center',
    'shrink-0',
    'self-center',
    'leading-none',
    'mr-2',
  ].join(' ');
