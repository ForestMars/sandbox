// packages/agents/src/style-formatter.ts
export const applyStyle = (text: string, style?: string): string => {
  if (style === 'efficient') {
    return `Don't Make Me Laugh!!! ${text}`;
  }
  return text;
};