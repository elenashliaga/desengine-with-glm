import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { StatusIndicator } from './Component';
import { mockStatusProps } from './mock';

export default {
  title: 'Components/StatusIndicator',
  component: StatusIndicator,
} as ComponentMeta<typeof StatusIndicator>;

const Template: ComponentStory<typeof StatusIndicator> = (args) => <StatusIndicator {...args} />;

export const Default = Template.bind({});
Default.args = mockStatusProps;
