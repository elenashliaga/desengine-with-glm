import type { Meta, StoryObj } from '@storybook/react';
import { DipoleRadio } from './Component';
import { dipoleRadioMock } from './mock';

const meta: Meta<typeof DipoleRadio> = {
  title: 'Components/DipoleRadio',
  component: DipoleRadio,
  args: dipoleRadioMock.base,
};

export default meta;

type Story = StoryObj<typeof DipoleRadio>;

export const Base: Story = {};

export const Checked: Story = {
  args: dipoleRadioMock.checked,
};

export const Disabled: Story = {
  args: dipoleRadioMock.disabled,
};
