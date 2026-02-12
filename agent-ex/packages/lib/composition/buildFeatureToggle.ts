import { FeatureToggle } from '@packages/domain/ports';
import { JsonFeatureToggle } from '@packages/infra/adapters';

export function buildFeatureToggle(env: string): FeatureToggle {
  if (env === 'production') {
    // Could swap to LaunchDarkly here
    return new JsonFeatureToggle();
  }
  return new JsonFeatureToggle();
}
