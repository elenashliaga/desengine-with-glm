import React from 'react';
import { installmentOptionsMock } from './mock';
import { InstallmentOptionsProps } from './props';
import { styles } from './styles';

export const Component: React.FC<InstallmentOptionsProps> = ({
  options,
  className,
  columns = 2,
}) => {
  const safeOptions = Array.isArray(options) && options.length > 0 ? options : installmentOptionsMock;
  const safeColumns = Number.isFinite(columns) && columns > 0 ? Math.floor(columns) : 2;

  return (
    <div className={`${styles.container} ${className ?? ''}`.trim()}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
      >
        {safeOptions.map((item, index) => {
          const title = item?.title ?? '—';
          const subtitle = item?.subtitle ?? '';
          const tone = item?.tone === 'light' ? 'light' : 'dark';

          return (
            <div
              key={item?.id ?? `${title}-${index}`}
              className={`${styles.cardBase} ${tone === 'light' ? styles.cardLight : styles.cardDark}`}
            >
              <div className={`${styles.title} ${tone === 'light' ? styles.titleLight : styles.titleDark}`}>
                {title}
              </div>
              <div
                className={`${styles.subtitle} ${tone === 'light' ? styles.subtitleLight : styles.subtitleDark}`}
              >
                {subtitle}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Component;
