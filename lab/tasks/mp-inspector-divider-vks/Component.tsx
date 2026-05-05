import React from 'react';
import { defaultProps, type MpInspectorDividerVksProps } from './props';
import { styles } from './styles';

export const Component: React.FC<MpInspectorDividerVksProps> = (rawProps) => {
  const props = { ...defaultProps, ...rawProps };

  const label = typeof props.label === 'string' && props.label.trim() ? props.label : 'Label';
  const tone = props.tone === 'danger' ? 'danger' : 'neutral';
  const widthClass = typeof props.widthClassName === 'string' && props.widthClassName.trim() ? props.widthClassName : styles.defaultWidth;

  return (
    <div
      className={[styles.root, widthClass].join(' ')}
      role="separator"
      aria-label={label || 'divider'}
    >
      <span className={styles.line} aria-hidden="true" />
      <span className={tone === 'danger' ? styles.badgeDanger : styles.badgeNeutral}>{label}</span>
      <span className={styles.line} aria-hidden="true" />
    </div>
  );
};

export default Component;
