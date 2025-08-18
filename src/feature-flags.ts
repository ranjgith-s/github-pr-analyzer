export interface FeatureFlags {
  [key: string]: boolean;
}

export const featureFlags: FeatureFlags = {
  bookmark: false,
  share: false,
};
