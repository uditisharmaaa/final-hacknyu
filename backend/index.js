import "dotenv/config";
import express from "express";
import { handleIncomingCall, processSpeech } from "./services/twilio.js";
import { getStoredAudio, cleanupExpiredAudio } from "./services/elevenlabs.js";

const app = express();

// CORS middleware
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

// Health check endpoint
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Audio streaming endpoint
app.get("/audio/:audioId", (req, res) => {
  const storedAudio = getStoredAudio(req.params.audioId);
  if (!storedAudio) {
    return res.status(404).send("Audio not found");
  }

  res.setHeader("Content-Type", storedAudio.mimeType);
  res.setHeader("Cache-Control", "no-store");
  return res.send(storedAudio.buffer);
});

// Twilio webhook for incoming calls
app.post("/incoming-call", async (req, res) => {
  try {
    const twiml = await handleIncomingCall(req);
    res.type("text/xml");
    return res.send(twiml);
  } catch (error) {
    console.error("Error in /incoming-call:", error);
    return res.status(500).send("Internal server error");
  }
});

// Twilio webhook for processing speech
app.post("/process-speech", async (req, res) => {
  try {
    const twiml = await processSpeech(req);
    res.type("text/xml");
    return res.send(twiml);
  } catch (error) {
    console.error("Error in /process-speech:", error);
    return res.status(500).send("Internal server error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Voice assistant backend listening on port ${PORT}`);
});

// Cleanup expired audio files every minute
setInterval(cleanupExpiredAudio, 60 * 1000);
