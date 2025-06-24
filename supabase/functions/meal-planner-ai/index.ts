import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Load environment variables for AI provider selection
const AI_PROVIDER = Deno.env.get("AI_PROVIDER") ?? "groq";

// === Adapter: Groq + Mixtral (mistral-saba-24b) ===
async function callGroq(prompt) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-saba-24b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  const result = await response.json();
  const message = result?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(message);
}

// === Adapter: Claude (Anthropic) ===
async function callClaude(prompt) {
  const apiKey = Deno.env.get("CLAUDE_API_KEY");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const result = await response.json();
  const content = result?.content?.[0]?.text ?? "{}";
  return JSON.parse(content);
}

// === Adapter: OpenAI ===
async function callOpenAI(prompt) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  const result = await response.json();
  const message = result?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(message);
}

// === Dispatcher ===
async function getAIResponse(prompt) {
  switch (AI_PROVIDER) {
    case "claude":
      return await callClaude(prompt);
    case "openai":
      return await callOpenAI(prompt);
    case "groq":
    default:
      return await callGroq(prompt);
  }
}

// === Supabase Edge Function handler ===
serve(async (req) => {
  try {
    const { prompt } = await req.json();
    const data = await getAIResponse(prompt);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
