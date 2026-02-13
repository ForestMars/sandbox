// packages/infra/adapters/JsonFileProvider.ts
import { Provider, ResolutionDetails, JsonValue } from '@openfeature/server-sdk';
import flagsConfig from '../../../config/flags.json';

export class JsonFileProvider implements Provider {
  metadata = {
    name: 'JsonFileProvider',
  };

  resolveBooleanEvaluation(flagKey: string, defaultValue: boolean): ResolutionDetails<boolean> {
    const value = flagsConfig[flagKey]?.enabled ?? defaultValue;
    return {
      value,
    };
  }

  resolveStringEvaluation(flagKey: string, defaultValue: string): ResolutionDetails<string> {
    const value = flagsConfig[flagKey]?.value ?? defaultValue;
    return {
      value,
    };
  }

  resolveNumberEvaluation(flagKey: string, defaultValue: number): ResolutionDetails<number> {
    const value = flagsConfig[flagKey]?.value ?? defaultValue;
    return {
      value,
    };
  }

  resolveObjectEvaluation<T extends JsonValue>(flagKey: string, defaultValue: T): ResolutionDetails<T> {
    const value = flagsConfig[flagKey]?.value ?? defaultValue;
    return {
      value,
    };
  }
}
