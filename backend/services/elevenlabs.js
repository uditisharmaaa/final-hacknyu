import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { randomUUID } from "crypto";

const AUDIO_TTL_MS = 5 * 60 * 1000;
const audioStore = new Map();

const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Generates speech audio from text and returns a URL to access it
 */
export async function generateSpeechUrl(text, baseUrl) {
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

/**
 * Retrieves stored audio by ID
 */
export function getStoredAudio(audioId) {
  return audioStore.get(audioId);
}

/**
 * Converts various stream types to Buffer
 */
async function toBuffer(stream) {
  if (!stream) {
    return Buffer.alloc(0);
  }

  // Handle ReadableStream (Web Streams API)
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

  // Handle Node.js streams
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

/**
 * Cleanup expired audio files
 */
export function cleanupExpiredAudio() {
  const expiration = Date.now() - AUDIO_TTL_MS;
  for (const [audioId, audio] of audioStore.entries()) {
    if (audio.createdAt < expiration) {
      audioStore.delete(audioId);
    }
  }
}

