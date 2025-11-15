import "dotenv/config";
import express from "express";
import twilio from "twilio";
import { randomUUID } from "crypto";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;

const AUDIO_TTL_MS = 5 * 60 * 1000;
const audioStore = new Map();
const callSessions = new Map();

const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.get("/audio/:audioId", (req, res) => {
  const storedAudio = audioStore.get(req.params.audioId);
  if (!storedAudio) {
    return res.status(404).send("Audio not found");
  }

  res.setHeader("Content-Type", storedAudio.mimeType);
  res.setHeader("Cache-Control", "no-store");
  return res.send(storedAudio.buffer);
});

app.post("/incoming-call", async (req, res) => {
  const callSid = req.body?.CallSid;
  const session = getOrCreateSession(callSid);
  session.stage = "greeting";

  const twiml = new VoiceResponse();

  try {
    const greetingText =
      "Hi, you have reached Luna Hair Studio. I am Luna, the virtual assistant. How can I help you today?";
    const audioUrl = await generateSpeechUrl(greetingText, resolveBaseUrl(req));
    const gather = twiml.gather({
      input: "speech",
      action: "/process-speech",
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    });
    gather.play(audioUrl);
  } catch (error) {
    console.error("Failed to greet caller", error);
    twiml.say(
      "Hi, we are experiencing technical difficulties. Please try again shortly."
    );
    twiml.hangup();
  }

  res.type("text/xml");
  return res.send(twiml.toString());
});

app.post("/process-speech", async (req, res) => {
  const callSid = req.body?.CallSid;
  const userSpeech = req.body?.SpeechResult;
  const session = getOrCreateSession(callSid);
  const twiml = new VoiceResponse();

  try {
    let agentMessage;
    let shouldEndCall = false;

    if (!userSpeech) {
      agentMessage =
        "I did not catch that. Could you please repeat your request?";
    } else {
      const intent = detectIntent(userSpeech, session);
      const response = handleIntent(session, intent, userSpeech);
      agentMessage = response.message;
      shouldEndCall = response.shouldEndCall ?? false;
    }

    const audioUrl = await generateSpeechUrl(agentMessage, resolveBaseUrl(req));

    if (shouldEndCall) {
      twiml.play(audioUrl);
      twiml.say("Thank you for calling Luna Hair Studio. Goodbye!");
      twiml.hangup();
      callSessions.delete(callSid);
    } else {
      const gather = twiml.gather({
        input: "speech",
        action: "/process-speech",
        method: "POST",
        speechTimeout: "auto",
        language: "en-US",
      });
      gather.play(audioUrl);
    }
  } catch (error) {
    console.error("Error processing speech", error);
    twiml.say("Sorry, something went wrong while processing your request.");
    twiml.hangup();
  }

  res.type("text/xml");
  return res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Voice assistant backend listening on port ${PORT}`);
});

function resolveBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"]
    ? req.headers["x-forwarded-proto"].split(",")[0]
    : req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}

async function generateSpeechUrl(text, baseUrl) {
  if (!text) {
    throw new Error("Cannot synthesize empty text");
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    throw new Error("ELEVENLABS_VOICE_ID is not configured");
  }

  const audioStream = await elevenLabsClient.textToSpeech.convert(voiceId, {
    text,
    model_id: "eleven_turbo_v2",
    output_format: "mp3_44100_128",
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.8,
    },
  });

  const buffer = await toBuffer(audioStream);
  const audioId = randomUUID();
  audioStore.set(audioId, {
    buffer,
    mimeType: "audio/mpeg",
    createdAt: Date.now(),
  });

  return `${baseUrl}/audio/${audioId}`;
}

async function toBuffer(stream) {
  if (!stream) {
    return Buffer.alloc(0);
  }

  if (typeof stream.getReader === "function") {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(Buffer.from(value));
      }
    }
    return Buffer.concat(chunks);
  }

  if (typeof stream.on === "function") {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.once("end", () => resolve(Buffer.concat(chunks)));
      stream.once("error", reject);
    });
  }

  throw new Error("Unsupported stream type from ElevenLabs");
}

function getOrCreateSession(callSid) {
  if (!callSid) {
    return {
      stage: "greeting",
      booking: { service: null, time: null, name: null },
      lastIntent: null,
    };
  }

  if (!callSessions.has(callSid)) {
    callSessions.set(callSid, {
      stage: "greeting",
      booking: { service: null, time: null, name: null },
      lastIntent: null,
    });
  }

  return callSessions.get(callSid);
}

function detectIntent(text = "", session) {
  if (session?.lastIntent === "booking" && !isBookingComplete(session.booking)) {
    return "booking";
  }

  const normalized = text.toLowerCase();
  if (containsKeyword(normalized, ["book", "appointment", "schedule", "reserve"])) {
    return "booking";
  }
  if (containsKeyword(normalized, ["price", "cost", "service", "hours", "open"])) {
    return "info";
  }
  if (containsKeyword(normalized, ["cancel", "reschedule", "change", "move"])) {
    return "cancel";
  }
  if (containsKeyword(normalized, ["message", "voicemail"])) {
    return "message";
  }
  return "fallback";
}

function containsKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function handleIntent(session, intent, userSpeech) {
  switch (intent) {
    case "booking":
      return handleBookingFlow(session, userSpeech);
    case "info":
      return {
        message:
          "We offer haircuts, color treatments, and blowouts. Prices start at sixty five dollars and we are open from 9 AM to 7 PM Tuesday through Saturday. Would you like to book a slot?",
        shouldEndCall: false,
      };
    case "cancel":
      session.lastIntent = "cancel";
      return {
        message:
          "I can help with cancellations or reschedules. Please tell me the name on the appointment and the time you would like to change.",
        shouldEndCall: false,
      };
    case "message":
      session.lastIntent = "message";
      return {
        message:
          "Sure, please tell me your name, number, and what this is regarding, and I will pass the message along.",
        shouldEndCall: false,
      };
    default:
      return {
        message:
          "I want to make sure I get this right. Could you rephrase or tell me if you want to book, ask a question, or leave a message?",
        shouldEndCall: false,
      };
  }
}

function handleBookingFlow(session, userSpeech = "") {
  session.lastIntent = "booking";
  const booking = session.booking;
  const normalized = userSpeech.toLowerCase();

  if (!booking.service) {
    const service = detectService(normalized);
    if (service) {
      booking.service = service;
      return {
        message: `Great, a ${service}. We have Wednesday at 3 PM or Thursday at 5 PM available. Which works for you?`,
        shouldEndCall: false,
      };
    }
    return {
      message:
        "Absolutely. Which service would you like to schedule? We offer haircuts, color sessions, and blowouts.",
      shouldEndCall: false,
    };
  }

  if (!booking.time) {
    booking.time = userSpeech.trim() || "unspecified time";
    return {
      message: "Perfect. What name should I put on that appointment?",
      shouldEndCall: false,
    };
  }

  if (!booking.name) {
    booking.name = userSpeech.trim() || "guest";
    return {
      message: `Amazing, ${booking.name}. I have you down for a ${booking.service} on ${booking.time}. You will get a confirmation shortly. Anything else I can help with?`,
      shouldEndCall: true,
    };
  }

  return {
    message: "You are all set. I will send over the confirmation right away.",
    shouldEndCall: true,
  };
}

function detectService(text) {
  const services = ["haircut", "color", "balayage", "trim", "blowout", "treatment"];
  return services.find((service) => text.includes(service));
}

function isBookingComplete(booking) {
  return Boolean(booking.service && booking.time && booking.name);
}

setInterval(() => {
  const expiration = Date.now() - AUDIO_TTL_MS;
  for (const [audioId, audio] of audioStore.entries()) {
    if (audio.createdAt < expiration) {
      audioStore.delete(audioId);
    }
  }
}, 60 * 1000);
