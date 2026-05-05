import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Component from './Component';
import { easyBuyAppButtonMock } from './mock';

const meta: Meta<typeof Component> = {
  title: 'Components/easy-buy-app-button',
  component: Component,
  args: easyBuyAppButtonMock,
};

export default meta;

type Story = StoryObj<typeof Component>;

export const Base: Story = {};
