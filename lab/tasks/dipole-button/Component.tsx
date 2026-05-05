import React from 'react';
import { buttonStyles } from './styles';
import type { DipoleButtonProps } from './props';

export const DipoleButton: React.FC<DipoleButtonProps> = ({
  label = 'Button',
  disabled = false,
  className = '',
}) => {
  const classes = [buttonStyles.base, disabled ? buttonStyles.disabled : buttonStyles.enabled, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} disabled={disabled} aria-disabled={disabled}>
      <span className={buttonStyles.label}>{String(label)}</span>
    </button>
  );
};

export default DipoleButton;