import OpenAI from "openai";

export interface OpenAIConfig {
  apiKey: string;
  model: string;
}

function readEnv(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getOpenAIConfig(): OpenAIConfig | null {
  const apiKey = readEnv(process.env.OPENAI_API_KEY);

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: readEnv(process.env.OPENAI_MODEL) || "gpt-4.1-mini"
  };
}

export function isOpenAIConfigured() {
  return Boolean(getOpenAIConfig());
}

export function getOpenAIClient() {
  const config = getOpenAIConfig();

  if (!config) {
    return null;
  }

  return {
    client: new OpenAI({ apiKey: config.apiKey }),
    model: config.model
  };
}
