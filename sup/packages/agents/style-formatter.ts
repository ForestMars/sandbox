// packages/agents/src/style-formatter.ts
export const applyStyle = (text: string, style?: string): string => {
  if (style === 'efficient') {
    return `I'm very efficient!!! ${text}`;
  }
  return text;
};