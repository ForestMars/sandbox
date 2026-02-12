import { FeatureToggle, FeatureContext } from '@domain/ports';
import flags from '../../../config/flags.json';

export class JsonFeatureToggle implements FeatureToggle {
  private flags: Record<string, any>;
  
  constructor(flagsPath?: string) {
    this.flags = flagsPath ? require(flagsPath) : flags;
  }
  
  isEnabled(flag: string, context?: FeatureContext): boolean {
    return this.flags[flag]?.enabled ?? false;
  }
  
  getVariant<T>(flag: string, defaultValue: T): T {
    return this.flags[flag]?.value ?? defaultValue;
  }
}
