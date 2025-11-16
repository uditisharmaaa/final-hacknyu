// server.js
import "dotenv/config";
import express from "express";
import twilio from "twilio";
import { randomUUID } from "crypto";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { google } from "googleapis";
import * as chrono from "chrono-node";

const app = express();
const VoiceResponse = twilio.twiml.VoiceResponse;

const AUDIO_TTL_MS = 5 * 60 * 1000;
const audioStore = new Map();
const callSessions = new Map();

const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/* ---------------- Google OAuth2 + Calendar setup ---------------- */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob"
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
} else {
  console.warn("GOOGLE_REFRESH_TOKEN not set — calendar calls will fail until provided.");
}
const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const BUSINESS_TZ = process.env.BUSINESS_TIMEZONE || "America/New_York";

/* ---------------- Middlewares ---------------- */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.get("/audio/:audioId", (req, res) => {
  const stored = audioStore.get(req.params.audioId);
  if (!stored) return res.status(404).send("Audio not found");
  res.setHeader("Content-Type", stored.mimeType);
  res.setHeader("Cache-Control", "no-store");
  res.send(stored.buffer);
});

/* ---------------- Twilio Call flow ---------------- */
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
      action: absoluteUrl("/process-speech", req),
      method: "POST",
      speechTimeout: "auto",
      language: "en-US",
    });
    gather.play(audioUrl);
  } catch (error) {
    console.error("Failed to greet caller", error);
    twiml.say("Hi, we are experiencing technical difficulties. Please try again shortly.");
    twiml.hangup();
  }

  res.type("text/xml");
  return res.send(twiml.toString());
});

app.post("/process-speech", async (req, res) => {
  const callSid = req.body?.CallSid;
  const userSpeech = req.body?.SpeechResult || "";
  const session = getOrCreateSession(callSid);
  const twiml = new VoiceResponse();

  try {
    let agentMessage;
    let shouldEndCall = false;

    if (!userSpeech.trim()) {
      agentMessage = "I did not catch that. Could you please repeat your request?";
    } else {
      const intent = detectIntent(userSpeech, session);
      const response = await handleIntent(session, intent, userSpeech, req);
      agentMessage = response.message;
      shouldEndCall = response.shouldEndCall ?? false;
    }

    const audioUrl = await generateSpeechUrl(agentMessage, resolveBaseUrl(req));

    if (shouldEndCall) {
      // If booking was completed, create calendar event before ending
      if (session.lastIntent === "booking" && isBookingComplete(session.booking)) {
        try {
          const evt = await createCalendarEvent(session.booking);
          console.log("Calendar event created:", evt.data?.id);
          // optionally attach event link to confirmation message
        } catch (err) {
          console.error("Calendar create failed:", err);
          // Let the user know we couldn't schedule to the calendar (still end call)
        }
      }

      twiml.play(audioUrl);
      twiml.say("Thank you for calling Luna Hair Studio. Goodbye!");
      twiml.hangup();
      callSessions.delete(callSid);
    } else {
      const gather = twiml.gather({
        input: "speech",
        action: absoluteUrl("/process-speech", req),
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

/* ---------------- Calendar helper: check availability for proposed slots ----------------
   We'll use `freebusy.query` to see if targeted times are free.
   Proposed times example: Wed 3pm, Thu 5pm relative to next occurrence.
------------------------------------------------------------------ */
async function checkAvailabilityForSlots(slotDates) {
  // slotDates: array of { start: Date, end: Date }
  if (!oauth2Client.credentials.refresh_token) {
    throw new Error("No GOOGLE_REFRESH_TOKEN set");
  }
  const items = [{ id: CALENDAR_ID }];
  const requestBody = {
    timeMin: new Date(Math.min(...slotDates.map(s => s.start.getTime()))).toISOString(),
    timeMax: new Date(Math.max(...slotDates.map(s => s.end.getTime()))).toISOString(),
    items,
  };

  const res = await calendar.freebusy.query({ requestBody });
  const busy = (res?.data?.calendars?.[CALENDAR_ID]?.busy) || [];

  // For each candidate, return whether it's free
  return slotDates.map(slot => {
    const conflict = busy.some(b => !(slot.end <= new Date(b.start) || slot.start >= new Date(b.end)));
    return { slot, free: !conflict };
  });
}

/* ---------------- Create calendar event (booking) ---------------- */
async function createCalendarEvent(booking) {
  if (!booking || !booking.service || !booking.time || !booking.name) {
    throw new Error("Incomplete booking for calendar event creation");
  }

  // attempt to parse booking.time using chrono
  let startDate = parseNaturalDate(booking.time);
  if (!startDate) {
    // fallback: set to next Wednesday 15:00 local business tz
    startDate = getNextWeekdayDate(3, 15, 0);
  }

  const durationMinutes = booking.durationMinutes || 60;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const eventBody = {
    summary: `${booking.service} — ${booking.name}`,
    description: `Booked by ${booking.name} via Luna assistant.`,
    start: { dateTime: startDate.toISOString(), timeZone: BUSINESS_TZ },
    end: { dateTime: endDate.toISOString(), timeZone: BUSINESS_TZ },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 60 }, { method: "email", minutes: 24 * 60 }],
    },
  };

  return await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: eventBody,
  });
}

/* ------------------ Utilities ------------------ */

function absoluteUrl(path, req) {
  return resolveBaseUrl(req) + path;
}

function resolveBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"].split(",")[0] : req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}

async function generateSpeechUrl(text, baseUrl) {
  if (!text) throw new Error("Cannot synthesize empty text");
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID is not configured");

  const audioStream = await elevenLabsClient.textToSpeech.convert(voiceId, {
    text,
    model_id: "eleven_turbo_v2",
    output_format: "mp3_44100_128",
    voice_settings: { stability: 0.6, similarity_boost: 0.8 },
  });

  const buffer = await toBuffer(audioStream);
  const audioId = randomUUID();
  audioStore.set(audioId, { buffer, mimeType: "audio/mpeg", createdAt: Date.now() });
  return `${baseUrl}/audio/${audioId}`;
}

async function toBuffer(stream) {
  if (!stream) return Buffer.alloc(0);
  if (typeof stream.getReader === "function") {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (c) => chunks.push(Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/* ---------------- Session + intent logic (mostly your original) ---------------- */
function getOrCreateSession(callSid) {
  if (!callSid) return { stage: "greeting", booking: { service: null, time: null, name: null }, lastIntent: null };

  if (!callSessions.has(callSid)) {
    callSessions.set(callSid, { stage: "greeting", booking: { service: null, time: null, name: null }, lastIntent: null });
  }
  return callSessions.get(callSid);
}

function detectIntent(text = "", session) {
  if (session?.lastIntent === "booking" && !isBookingComplete(session.booking)) return "booking";

  const normalized = text.toLowerCase();
  if (containsKeyword(normalized, ["book", "appointment", "schedule", "reserve"])) return "booking";
  if (containsKeyword(normalized, ["price", "cost", "service", "hours", "open"])) return "info";
  if (containsKeyword(normalized, ["cancel", "reschedule", "change", "move"])) return "cancel";
  if (containsKeyword(normalized, ["message", "voicemail"])) return "message";
  return "fallback";
}

function containsKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

async function handleIntent(session, intent, userSpeech, req) {
  switch (intent) {
    case "booking":
      return await handleBookingFlow(session, userSpeech, req);
    case "info":
      session.lastIntent = "info";
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

/* ---------------- Booking flow now checks calendar availability before proposing slots ----------------
   Behavior:
   - If service not chosen: ask for service
   - If service chosen but time not chosen: check availability for candidate times (Wed 3pm, Thu 5pm) and propose only free slots
   - If time chosen -> ask for name
   - If name chosen -> create booking and mark for calendar insertion
------------------------------------------------------------------ */
async function handleBookingFlow(session, userSpeech = "", req) {
  session.lastIntent = "booking";
  const booking = session.booking;
  const normalized = (userSpeech || "").toLowerCase();

  // Step 1: ask for service
  if (!booking.service) {
    const service = detectService(normalized);
    if (service) {
      booking.service = service;
      // set duration heuristics
      booking.durationMinutes = service === "color" ? 120 : 60;

      // Build candidate times: next Wednesday 3pm, next Thursday 5pm in business tz
      const candidate1 = getNextWeekdayDate(3, 15, 0); // Wed 15:00
      const candidate2 = getNextWeekdayDate(4, 17, 0); // Thu 17:00

      // Make end times
      const candidates = [
        { start: candidate1, end: new Date(candidate1.getTime() + booking.durationMinutes * 60000) },
        { start: candidate2, end: new Date(candidate2.getTime() + booking.durationMinutes * 60000) },
      ];

      // Check availability
      let availability;
      try {
        availability = await checkAvailabilityForSlots(candidates);
      } catch (err) {
        console.warn("Availability check failed, proposing default times", err);
        // fallback to proposing both if API fails
        availability = candidates.map(s => ({ slot: s, free: true }));
      }

      // Build response listing free slots first
      const freeSlots = availability.filter(a => a.free).map(a => a.slot);
      const busySlots = availability.filter(a => !a.free).map(a => a.slot);

      if (freeSlots.length > 0) {
        // format times for speech
        const slotPhrases = freeSlots.map(s => `${formatDateForSpeech(s.start)}`).join(" or ");
        booking.candidateSlots = freeSlots; // store for later
        return { message: `Great, a ${service}. I can offer ${slotPhrases}. Which works for you?`, shouldEndCall: false };
      } else {
        // no free candidate; offer an alternative generic reply
        return { message: `Thanks. I don't see those exact slots free — what day/time generally works for you?`, shouldEndCall: false };
      }
    }

    return {
      message:
        "Absolutely. Which service would you like to schedule? We offer haircuts, color sessions, and blowouts.",
      shouldEndCall: false,
    };
  }

  // Step 2: time selection (if candidateSlots exist, accept one of them; otherwise accept natural language)
  if (!booking.time) {
    // If user picks one of the candidate slots (user might say "Wednesday at 3" or "the first one"), we attempt to match
    const mentioned = userSpeech.trim();
    let chosen = null;

    // Try to detect if they referred to candidate slots by day/time
    if (session.booking?.candidateSlots) {
      for (const slot of session.booking.candidateSlots) {
        const sText = slot.start.toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "numeric", timeZone: BUSINESS_TZ });
        if (mentioned.toLowerCase().includes(slot.start.toLocaleString("en-US", { weekday: "long", timeZone: BUSINESS_TZ }).toLowerCase()) ||
            mentioned.toLowerCase().includes(String(slot.start.getHours()))) {
          chosen = slot.start;
          break;
        }
      }
    }

    // Otherwise try chrono
    if (!chosen) chosen = parseNaturalDate(userSpeech);

    if (chosen) {
      booking.time = chosen.toString();
      // store parsed date for calendar creation
      booking._parsedStart = chosen;
      booking._parsedEnd = new Date(chosen.getTime() + (booking.durationMinutes || 60) * 60000);
      return { message: "Perfect. What name should I put on that appointment?", shouldEndCall: false };
    }

    booking.time = userSpeech.trim() || "unspecified time";
    return { message: "Perfect. What name should I put on that appointment?", shouldEndCall: false };
  }

  // Step 3: name
  if (!booking.name) {
    booking.name = userSpeech.trim() || "guest";
    // mark booking time parsed if not already
    if (!booking._parsedStart) {
      booking._parsedStart = parseNaturalDate(booking.time) || getNextWeekdayDate(3, 15, 0);
      booking._parsedEnd = new Date(booking._parsedStart.getTime() + (booking.durationMinutes || 60) * 60000);
    }
    // booking is complete now; we will attempt to create calendar event after response (in process-speech)
    return {
      message: `Amazing, ${booking.name}. I have you down for a ${booking.service} on ${formatDateForSpeech(booking._parsedStart)}. You will get a confirmation shortly. Anything else I can help with?`,
      shouldEndCall: true,
    };
  }

  return { message: "You are all set. I will send over the confirmation right away.", shouldEndCall: true };
}

function detectService(text) {
  const services = ["haircut", "color", "balayage", "trim", "blowout", "treatment", "cut"];
  return services.find((s) => text.includes(s));
}
function isBookingComplete(booking) {
  return Boolean(booking && booking.service && booking.time && booking.name);
}

// function containsKeyword(text, keywords) {
//   return keywords.some((keyword) => text.includes(keyword));
// }

/* ---------------- date helpers ---------------- */
function parseNaturalDate(text) {
  if (!text) return null;
  try {
    const results = chrono.parse(text, new Date(), { forwardDate: true });
    if (results && results.length) return results[0].start.date();
    const d = new Date(text);
    if (!isNaN(d.getTime())) return d;
  } catch (e) {
    return null;
  }
  return null;
}
function getNextWeekdayDate(targetWeekday, hour = 15, minute = 0) {
  // targetWeekday: 0=Sun..6=Sat
  const now = new Date();
  const today = now.getDay();
  let daysAhead = (targetWeekday + 7 - today) % 7;
  if (daysAhead === 0) daysAhead = 7;
  const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, hour, minute, 0);
  return dt;
}
function formatDateForSpeech(date) {
  try {
    return date.toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "numeric", timeZone: BUSINESS_TZ });
  } catch (e) {
    return date.toString();
  }
}

/* ---------------- Clear audio cache ---------------- */
setInterval(() => {
  const expire = Date.now() - AUDIO_TTL_MS;
  for (const [id, audio] of audioStore.entries()) {
    if (audio.createdAt < expire) audioStore.delete(id);
  }
}, 60 * 1000);

/* ---------------- Start server ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Voice assistant backend listening on ${PORT}`));
