export interface FeatureToggle {
  isEnabled(flag: string, context?: FeatureContext): boolean;
  getVariant<T>(flag: string, defaultValue: T, context?: FeatureContext): T;
}

export interface FeatureContext {
  userId?: string;
  environment?: string;
  [key: string]: any;
}
