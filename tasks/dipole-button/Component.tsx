import React from 'react';
import { ButtonProps } from './props';
import { containerStyles, iconStyles, labelStyles } from './styles';

const Component: React.FC<ButtonProps> = ({ label, showIcon }) => {
  return (
    <div className={containerStyles}>
      {showIcon && <div className={iconStyles} />}
      <div className={labelStyles}>{label}</div>
    </div>
  );
};

export default Component;
