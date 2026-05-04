export interface FeatureItem {
  name: string;
  enabled: boolean;
}

export interface FeatureProps {
  features: FeatureItem[];
}
