/**
 * @file config.ts
 * @description Centralized configuration for the Support Agent, including model settings, instruction paths, and skill management.
 */
export const AGENT_CONFIG = {
  anchor: "### FINAL DIRECTIVE\nPrioritize entity resolution and customer satisfaction.",
  basePath: "./agents/instructions.txt",
  skillsPath: "./agents/skills/"
};
