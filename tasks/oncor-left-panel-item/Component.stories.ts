import React from 'react';
import { Meta, Story } from '@storybook/react';
import MyComponent from './Component';

export default {
  title: 'Example/MyComponent',
  component: MyComponent,
} as Meta;

const Template: Story<React.ComponentProps<typeof MyComponent>> = (args) => <MyComponent {...args} />;

export const Default = Template.bind({});
Default.args = {
  title: 'Заголовок',
  tag: 'Тег',
  tagNumber: 5,
};