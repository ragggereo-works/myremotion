export const MODELS = [
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export type StreamPhase = "idle" | "reasoning" | "generating";

export type GenerationErrorType = "validation" | "api";
