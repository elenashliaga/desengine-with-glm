import type { ButtonHTMLAttributes } from 'react';

export type DipoleButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label?: React.ReactNode;
};