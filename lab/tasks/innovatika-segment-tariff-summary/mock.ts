import { InstallmentOption } from './props';

export const installmentOptionsMock: InstallmentOption[] = [
  { id: 'm1-dark', title: '1 месяц', subtitle: 'Выгода 10%', tone: 'dark' },
  { id: 'm3-light-1', title: '3 месяца', subtitle: 'Выгода 10%', tone: 'light' },
  { id: 'm1-dark-2', title: '1 месяц', subtitle: 'Выгода 10%', tone: 'dark' },
  { id: 'm3-light-2', title: '3 месяца', subtitle: 'Выгода 10%', tone: 'light' },
  { id: 'm1-dark-3', title: '1 месяц', subtitle: 'Выгода 10%', tone: 'dark' },
  { id: 'm3-light-3', title: '3 месяца', subtitle: 'Выгода 10%', tone: 'light' },
];

export const installmentOptionsAllDarkMock: InstallmentOption[] = installmentOptionsMock.map((item) => ({
  ...item,
  tone: 'dark',
}));
