// Component.stories.ts
import React from 'react';
import { Component } from './Component';
import { mock } from './mock';

export default {
  title: 'Example/DipoleButton',
  component: Component,
};

export const Default = () => <Component {...mock} />;