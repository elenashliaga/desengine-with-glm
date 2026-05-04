export type InstallmentTone = 'dark' | 'light';

export interface InstallmentOption {
  id?: string;
  title: string;
  subtitle?: string;
  tone?: InstallmentTone;
}

export interface InstallmentOptionsProps {
  options?: InstallmentOption[];
  columns?: number;
  className?: string;
}
