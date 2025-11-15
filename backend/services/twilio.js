import twilio from "twilio";
import { generateSpeechUrl } from "./elevenlabs.js";
import { getOrCreateSession, deleteSession } from "../utils/session.js";
import { detectIntent, handleIntent } from "../utils/intent.js";

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Handles incoming call and generates greeting response
 */
export async function handleIncomingCall(req) {
  const callSid = req.body?.CallSid;
  const session = getOrCreateSession(callSid);
  session.stage = "greeting";

  const twiml = new VoiceResponse();

  try {
    const greetingText =
      "Hi, you have come to reach SUNY Hair Studio. I am Luna, the virtual assistant. How can I help you today?";
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

  return twiml.toString();
}

/**
 * Processes speech input from caller and generates appropriate response
 */
export async function processSpeech(req) {
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
      deleteSession(callSid);
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

  return twiml.toString();
}

/**
 * Resolves the base URL from request headers
 */
function resolveBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"]
    ? req.headers["x-forwarded-proto"].split(",")[0]
    : req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}
