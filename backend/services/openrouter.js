import axios from "axios";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "gpt-4.1-nano";

const REQUIRED_FIELDS = ["name", "email", "service", "gender", "datetime"];

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    collected: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        service: { type: "string" },
        gender: { type: "string" },
        datetime: { type: "string" },
      },
    },
    notes: { type: "string" },
  },
  required: ["reply", "collected"],
};

const SYSTEM_PROMPT = `
You are Luna, the friendly front-desk assistant for Luna Hair Studio. Collect the caller's appointment details in this EXACT order, asking ONE question at a time:

1. Name (first)
2. Email (second)
3. Service (third - haircut/color/balayage/trim/blowout/treatment)
4. Gender (fourth)
5. Datetime (fifth - exact date and time in Eastern Time)

CRITICAL RULES:
- Ask ONLY ONE question per response. Never ask multiple questions at once.
- Follow the order above strictly. Don't skip ahead or ask out of order.
- If the user provides multiple pieces of information, extract what you can but only ask for the NEXT missing item in the sequence.
- Keep your reply to ONE sentence maximum. Be brief and friendly.
- Confirm what you heard before moving to the next question.
- Remind callers about salon hours (Tue-Sat, 9am-7pm ET) only if they suggest times outside those hours.
- Never promise availability—just acknowledge you'll confirm it.

You MUST respond with valid JSON only, matching this exact structure:
{
  "reply": "your response text here",
  "collected": {
    "name": "extracted name or null",
    "email": "extracted email or null",
    "service": "extracted service or null",
    "gender": "extracted gender or null",
    "datetime": "ISO 8601 datetime string in America/New_York timezone or null"
  },
  "notes": "optional internal note"
}

Always include "reply" and "collected" fields. Only include fields in "collected" if you actually extracted them from the user's message.
`.trim();

/**
 * Calls OpenRouter to generate the assistant's next response.
 *
 * Environment variables:
 * - OPENROUTER_API_KEY: issued from https://openrouter.ai
 */
function buildContextualPrompt(appointment = {}) {
  const collected = [];
  const missing = [];

  if (appointment.name) collected.push("name");
  else missing.push("name");

  if (appointment.email) collected.push("email");
  else missing.push("email");

  if (appointment.service) collected.push("service");
  else missing.push("service");

  if (appointment.gender) collected.push("gender");
  else missing.push("gender");

  if (appointment.datetime) collected.push("datetime");
  else missing.push("datetime");

  let statusNote = "";
  if (collected.length > 0) {
    statusNote = `\n\nCURRENT STATUS: Already collected: ${collected.join(
      ", "
    )}. `;
  }
  if (missing.length > 0) {
    statusNote += `Next to ask for: ${missing[0]}.`;
  }

  return SYSTEM_PROMPT + statusNote;
}

export async function requestSalonAgentResponse({
  conversation = [],
  appointment = {},
  userSpeech,
}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment.");
  }

  const contextualPrompt = buildContextualPrompt(appointment);
  const messages = [
    { role: "system", content: contextualPrompt },
    ...conversation,
  ];

  if (userSpeech) {
    messages.push({ role: "user", content: userSpeech });
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        temperature: 0.3,
        top_p: 0.9,
        messages,
        response_format: {
          type: "json_object",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15_000,
      }
    );

    const content =
      response?.data?.choices?.[0]?.message?.content?.trim() ?? "{}";
    return parseAgentResponse(content);
  } catch (error) {
    console.error("OpenRouter request failed:", error?.response?.data || error);
    throw new Error("Failed to reach OpenRouter assistant");
  }
}

function parseAgentResponse(raw) {
  if (!raw) {
    return defaultFallback();
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to parse OpenRouter response:", raw);
    return {
      reply: raw,
      collected: {},
    };
  }
}

function defaultFallback() {
  return {
    reply:
      "I'm sorry, I had trouble understanding that. Could you please repeat what you need?",
    collected: {},
  };
}

export { REQUIRED_FIELDS as REQUIRED_APPOINTMENT_FIELDS };
