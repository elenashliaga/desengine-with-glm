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
    currentLevelStarted: true,
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
  promptHistory: [
    {
      text: 'Сделай подпись под карточкой компактнее и выровняй кнопку.',
      createdAt: '2026-05-11T10:15:30.000Z',
      displayCreatedAt: '2026-05-11 12:15:30',
      iterationNumber: 1,
      levelNumber: 1,
      selectedFileNames: ['Component.tsx', 'Component.stories.ts'],
      changedFileIds: ['component'],
      changedFileNames: ['Component.tsx'],
      teachingCostCents: 3,
    },
  ],
  llmUsageSummary: {
    totalCalls: 1,
    teachingCostCents: 3,
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
