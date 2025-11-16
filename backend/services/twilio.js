import twilio from "twilio";
import { generateSpeechUrl } from "./elevenlabs.js";
import { getOrCreateSession, deleteSession } from "../utils/session.js";
import { handleAppointmentTurn } from "../utils/intent.js";
import { sendAppointmentSMS } from "./sms.js";

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
      "Hi, you have come to reach Luna Hair Studio. I am Luna, the virtual assistant. How can I help you today?";
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
  const callerPhone = req.body?.From;
  const session = getOrCreateSession(callSid);
  const twiml = new VoiceResponse();

  try {
    const response = await handleAppointmentTurn(session, userSpeech);
    const agentMessage = response.message;
    const shouldEndCall = response.shouldEndCall ?? false;
    const audioUrl = await generateSpeechUrl(agentMessage, resolveBaseUrl(req));

    if (shouldEndCall) {
      twiml.play(audioUrl);
      twiml.say("Thank you for calling Luna Hair Studio. Goodbye!");
      twiml.hangup();

      const appointmentDetails =
        response.formattedAppointment ?? session.appointment;
      const smsRecipient =
        callerPhone ||
        appointmentDetails?.phone ||
        session.appointment?.phone ||
        null;

      if (appointmentDetails && smsRecipient) {
        sendAppointmentSMS(appointmentDetails, smsRecipient).catch((error) => {
          console.error("Failed to send appointment confirmation SMS:", error);
        });
      }

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
