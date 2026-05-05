import type { DipoleRadioProps } from './props';

export const dipoleRadioMock: Record<string, DipoleRadioProps> = {
  base: {
    label: 'Label',
    checked: false,
    disabled: false,
  },
  checked: {
    label: 'Label',
    checked: true,
    disabled: false,
  },
  disabled: {
    label: 'Label',
    checked: false,
    disabled: true,
  },
};
