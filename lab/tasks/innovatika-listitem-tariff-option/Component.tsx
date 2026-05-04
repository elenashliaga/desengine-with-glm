import React from 'react';
import { FeatureProps } from './props';
import {
  featureItemStyle,
  featureListStyle,
  featureNameStyle,
  statusIconStyle,
} from './styles';

const FeatureList: React.FC<FeatureProps> = ({ features }) => {
  const safeFeatures = Array.isArray(features) ? features : [];

  return (
    <ul className={featureListStyle}>
      {safeFeatures.map((feature, index) => {
        const isEnabled = Boolean(feature?.enabled);
        const name = typeof feature?.name === 'string' ? feature.name : '';

        return (
          <li key={index} className={featureItemStyle}>
            <span className={statusIconStyle(isEnabled)} aria-hidden="true">
              {isEnabled ? '✔' : '✖'}
            </span>
            <span className={featureNameStyle}>{name}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default FeatureList;
