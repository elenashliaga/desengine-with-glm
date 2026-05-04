import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import FeatureList from './Component';
import { mockFeatures } from './mock';

export default {
  title: 'Example/FeatureList',
  component: FeatureList,
} as ComponentMeta<typeof FeatureList>;

const Template: ComponentStory<typeof FeatureList> = (args) => <FeatureList {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  features: mockFeatures,
};
