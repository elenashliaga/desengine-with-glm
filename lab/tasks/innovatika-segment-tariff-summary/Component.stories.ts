import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';
import { installmentOptionsMock, installmentOptionsAllDarkMock } from './mock';

const meta: Meta<typeof Component> = {
  title: 'UI/InstallmentOptions',
  component: Component,
  args: {
    options: installmentOptionsMock,
    columns: 2,
  },
};

export default meta;

type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const AllDark: Story = {
  args: {
    options: installmentOptionsAllDarkMock,
  },
};

export const ThreeColumns: Story = {
  args: {
    columns: 3,
  },
};
