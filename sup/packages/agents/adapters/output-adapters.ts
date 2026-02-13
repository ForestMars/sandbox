import { efficientStyleGenerator } from './style-efficient.adapter';

export const OutputAdapters = [
  {
    flagName: 'efficient-style',
    wrapper: efficientStyleGenerator
  }
  // Add more adapters here as you create them
];
