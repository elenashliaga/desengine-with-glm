import type { Meta, StoryObj } from '@storybook/nextjs-vite';
 
import { Prompt } from './Prompt';
 
const meta = {
  component: Prompt,
} satisfies Meta<typeof Prompt>;
 
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    title: 'Task',
  },
};