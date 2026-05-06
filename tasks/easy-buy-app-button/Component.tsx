import React from 'react';
import { getButtonRootClassName, getButtonTextClassName } from './styles';
import type { EasyBuyAppButtonProps } from './props';

export function Component(props: EasyBuyAppButtonProps) {
  const { label } = props;

  return (
    <button type="button" className={getButtonRootClassName()} disabled>
      <span className={getButtonTextClassName()}>Это кнопка</span>
    </button>
  );
}

export default Component;
