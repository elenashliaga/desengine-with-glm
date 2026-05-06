import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';
import { mockDefault, mockDanger, mockStack } from './mock';

const meta: Meta<typeof Component> = {
  title: 'Components/mp-inspector-divider-vks',
  component: Component,
  args: mockDefault,
};

export default meta;

type Story = StoryObj<typeof Component>;

export const Default: Story = {};

export const DangerTone: Story = {
  args: mockDanger,
};

export const VariantsStack: Story = {
  render: () => (
    <div className="w-[522px] p-3 border border-dashed border-[#6d28d9] rounded-[8px] box-border flex flex-col gap-4 bg-black">
      {mockStack.map((item, index) => (
        <Component key={index} {...item} widthClassName="w-full" />
      ))}
    </div>
  ),
};
