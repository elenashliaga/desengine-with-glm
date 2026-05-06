export type DipoleRadioProps = {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  className?: string;
};

export const getSafeProps = (props: DipoleRadioProps | null | undefined) => {
  const safe = props ?? {};

  return {
    label: typeof safe.label === 'string' ? safe.label : 'Label',
    checked: Boolean(safe.checked),
    disabled: Boolean(safe.disabled),
    className: typeof safe.className === 'string' ? safe.className : '',
  };
};
