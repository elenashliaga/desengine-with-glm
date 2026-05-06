// Component.tsx
import React from 'react';
import { StatusLabel } from './styles';
import { StatusProps } from './props';

// Основной компонент
export const StatusIndicator: React.FC<StatusProps> = ({ status = 'online' }) => {
  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="ml-2 text-sm font-medium">{status}</span>
    </div>
  );
};

// styles.ts
type StatusColor = 'green' | 'red';

export const StatusLabel = {
  online: 'Online',
  offline: 'Offline',
};

// mock.ts
import { StatusProps } from './props';

export const mockStatusProps: StatusProps = {
  status: 'online',
};

// props.ts
export interface StatusProps {
  status?: 'online' | 'offline';
}

// Component.stories.ts
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
