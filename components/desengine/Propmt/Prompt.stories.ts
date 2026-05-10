import type { Meta, StoryObj } from '@storybook/nextjs-vite';
 
import { Prompt } from './Prompt';
import type { TaskData, TaskListItem } from '@/lib/types';

const taskItem: TaskListItem = {
  id: 'task-1',
  image: {
    width: 1280,
    height: 720,
  },
  started: true,
  maxLevel: 3,
  progress: {
    currentLevel: 1,
    currentLevelId: 'level-1',
    currentLevelStatus: 'in_progress',
    currentLevelDisplayStatus: 'in_progress',
    currentLevelInitialized: true,
    promptsUsed: 1,
    promptsLimit: 3,
    checkAttemptsUsed: 0,
    checkAttemptsLimit: 3,
    checkingState: 'idle',
    maxLevel: 3,
    isCompleted: false,
    hasNextLevel: true,
    completionReason: null,
  },
};

const taskData: TaskData = {
  taskId: 'task-1',
  contentByFileId: {},
  promptHistory: [],
  llmUsageSummary: {
    totalCalls: 0,
    teachingCostCents: 0,
    providersUsed: [],
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    callsWithoutProviderMetrics: 0,
  },
  labContext: {
    levelId: 'level-1',
    levelNumber: 1,
    labId: 'lab-1',
    commonExplanation: 'Общее описание уровня',
    taskTip: 'Описание задания',
    editableFileIds: ['src/app.ts'],
    images: [],
  },
};
 
const meta = {
  component: Prompt,
} satisfies Meta<typeof Prompt>;
 
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    title: 'Task',
    taskItem,
    taskData,
    status: 'Уточнение применено',
    error: '',
  },
};
