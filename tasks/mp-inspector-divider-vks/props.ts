export type MpInspectorDividerVksTone = 'neutral' | 'danger';

export interface MpInspectorDividerVksProps {
  /** Текст в центральной плашке */
  label?: string;
  /** Визуальный тон плашки */
  tone?: MpInspectorDividerVksTone;
  /** Класс ширины контейнера, чтобы переиспользовать компонент в разных раскладках */
  widthClassName?: string;
}

export const defaultProps: Required<Pick<MpInspectorDividerVksProps, 'label' | 'tone'>> = {
  label: 'Четверг, 28 августа 2025г.',
  tone: 'neutral',
};
