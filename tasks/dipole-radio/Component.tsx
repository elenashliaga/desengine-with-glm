import React from 'react';
import { DipoleRadioProps, getSafeProps } from './props';
import { styles } from './styles';

export const DipoleRadio: React.FC<DipoleRadioProps> = (rawProps) => {
  const { label, checked, disabled, className } = getSafeProps(rawProps);

  return (
    <label className={`${styles.root} ${disabled ? styles.disabled : ''} ${className}`.trim()}>
      <span className={styles.radioOuter} aria-hidden="true">
        {checked ? <span className={styles.radioInner} /> : null}
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  );
};

export default DipoleRadio;
