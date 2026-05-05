import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import DipoleButton from './Component';
import { defaultProps } from './mock';

const meta: Meta<typeof DipoleButton> = {
  title: 'Components/dipole-button',
  component: DipoleButton,
  args: defaultProps,
};

export default meta;
type Story = StoryObj<typeof DipoleButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};