import type { MpInspectorDividerVksProps } from './props';

export const mockDefault: MpInspectorDividerVksProps = {
  label: 'Четверг, 28 августа 2025г.',
  tone: 'neutral',
};

export const mockDanger: MpInspectorDividerVksProps = {
  label: 'Непрочитанные сообщения',
  tone: 'danger',
};

export const mockStack: MpInspectorDividerVksProps[] = [mockDefault, mockDanger];
