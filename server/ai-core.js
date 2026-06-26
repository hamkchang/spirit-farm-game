"use strict";

const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.4;

const AGENTS = {
  OP: {
    id: "OP",
    provider: "anthropic",
    modelEnv: ["OP_MODEL", "ANTHROPIC_MODEL"],
    defaultModel: "opus-4.8",
    keyEnv: ["OP_API_KEY", "ANTHROPIC_API_KEY", "METACLAW_ADS_ANTHROPIC_TOKEN"],
    role: "Operations controller",
  },
  GE: {
    id: "GE",
    provider: "google",
    modelEnv: ["GE_MODEL", "GEMINI_MODEL"],
    defaultModel: "gemini-3.5-flash",
    keyEnv: ["GE_API_KEY", "GEMINI_API_KEY", "METACLAW_ADS_GEMINI_TOKEN"],
    role: "Gemini risk and guidance analyst",
  },
};

function listAgents() {
  return Object.values(AGENTS).map((agent) => ({
    id: agent.id,
    provider: agent.provider,
    model: readFirstEnv(agent.modelEnv) || agent.defaultModel,
    role: agent.role,
    configured: Boolean(readFirstEnv(agent.keyEnv)),
    acceptedKeyEnv: agent.keyEnv,
  }));
}

async function runAgent(input) {
  const agentId = String(input.agent || "").trim().toUpperCase();
  const agent = AGENTS[agentId];
  if (!agent) {
    throw httpError(400, "Unknown agent. Use OP or GE.");
  }

  const message = String(input.message || "").trim();
  if (!message) {
    throw httpError(400, "Message is required.");
  }

  const apiKey = readFirstEnv(agent.keyEnv);
  if (!apiKey) {
    throw httpError(503, `${agent.id} is not configured. Add one of: ${agent.keyEnv.join(", ")}`);
  }

  const model = readFirstEnv(agent.modelEnv) || agent.defaultModel;
  const options = {
    model,
    apiKey,
    system: String(input.system || "").trim(),
    message,
    temperature: toNumber(input.temperature, envNumber("AI_TEMPERATURE", DEFAULT_TEMPERATURE)),
    maxTokens: Math.max(1, Math.floor(toNumber(input.maxTokens, envNumber("AI_MAX_TOKENS", DEFAULT_MAX_TOKENS)))),
  };

  if (agent.provider === "anthropic") {
    return callAnthropic(agent, options);
  }

  return callGemini(agent, options);
}

async function callAnthropic(agent, options) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": options.apiKey,
      "anthropic-version": process.env.ANTHROPIC_VERSION || "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      ...(options.system ? { system: options.system } : {}),
      messages: [
        {
          role: "user",
          content: options.message,
        },
      ],
    }),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw providerError(agent, response, data);
  }

  return {
    agent: agent.id,
    provider: agent.provider,
    model: options.model,
    text: extractAnthropicText(data),
    raw: compactRaw(data),
  };
}

async function callGemini(agent, options) {
  const style = (process.env.GEMINI_API_STYLE || "interactions").trim();
  const prompt = options.system ? `${options.system}\n\n${options.message}` : options.message;

  if (style === "generateContent") {
    return callGeminiGenerateContent(agent, options, prompt);
  }

  try {
    return await callGeminiInteractions(agent, options, prompt);
  } catch (error) {
    if (!error || !error.canFallback) {
      throw error;
    }
    return callGeminiGenerateContent(agent, options, prompt);
  }
}

async function callGeminiInteractions(agent, options, prompt) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: JSON.stringify({
      model: options.model,
      input: prompt,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    }),
  });

  const data = await readJson(response);
  if (!response.ok) {
    const error = providerError(agent, response, data);
    error.canFallback = response.status === 400 || response.status === 404;
    throw error;
  }

  return {
    agent: agent.id,
    provider: agent.provider,
    model: options.model,
    text: extractGeminiText(data),
    raw: compactRaw(data),
  };
}

async function callGeminiGenerateContent(agent, options, prompt) {
  const encodedModel = encodeURIComponent(options.model);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    }),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw providerError(agent, response, data);
  }

  return {
    agent: agent.id,
    provider: agent.provider,
    model: options.model,
    text: extractGeminiText(data),
    raw: compactRaw(data),
  };
}

function extractAnthropicText(data) {
  if (!data || !Array.isArray(data.content)) {
    return "";
  }
  return data.content
    .map((part) => (part && part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractGeminiText(data) {
  const candidateText = data && data.candidates && data.candidates[0]
    && data.candidates[0].content
    && Array.isArray(data.candidates[0].content.parts)
    ? data.candidates[0].content.parts.map((part) => part.text || "").filter(Boolean).join("\n")
    : "";

  if (candidateText) {
    return candidateText.trim();
  }

  const direct = findTextValue(data, 0);
  return direct.trim();
}

function findTextValue(value, depth) {
  if (!value || depth > 8) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => findTextValue(item, depth + 1)).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    for (const key of ["text", "output_text", "output", "content", "message", "response"]) {
      if (value[key]) {
        const found = findTextValue(value[key], depth + 1);
        if (found) {
          return found;
        }
      }
    }
  }
  return "";
}

function compactRaw(data) {
  if (!data || typeof data !== "object") {
    return data;
  }
  return {
    id: data.id,
    type: data.type,
    model: data.model,
    usage: data.usage || data.usageMetadata,
    finishReason: data.stop_reason || (data.candidates && data.candidates[0] && data.candidates[0].finishReason),
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
}

function providerError(agent, response, data) {
  const message = data && (data.error && (data.error.message || data.error.type) || data.message);
  return httpError(response.status || 502, `${agent.id} provider error: ${message || response.statusText || "request failed"}`);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function readFirstEnv(names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function envNumber(name, fallback) {
  return toNumber(process.env[name], fallback);
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  AGENTS,
  listAgents,
  runAgent,
};
