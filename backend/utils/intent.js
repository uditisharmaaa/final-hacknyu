import { format, isValid, parseISO } from "date-fns";
import { appendMessage, mergeAppointment } from "./session.js";
import {
  requestSalonAgentResponse,
  REQUIRED_APPOINTMENT_FIELDS,
} from "../services/openrouter.js";

/**
 * Main entry point that orchestrates a single conversational turn
 * with the OpenRouter-powered assistant.
 */
export async function handleAppointmentTurn(session, userSpeech = "") {
  const trimmedInput = (userSpeech ?? "").trim();

  if (!trimmedInput) {
    return {
      message: "I did not catch that. Could you please repeat what you need?",
      shouldEndCall: false,
    };
  }

  appendMessage(session, "user", trimmedInput);

  let assistantPayload;
  try {
    assistantPayload = await requestSalonAgentResponse({
      conversation: session.conversation,
      appointment: session.appointment,
      userSpeech: trimmedInput,
    });
  } catch (error) {
    console.error("Assistant turn failed:", error);
    return {
      message:
        "I am having trouble accessing our assistant right now. Could you repeat that in a moment?",
      shouldEndCall: false,
    };
  }

  const normalized = normalizeCollectedData(assistantPayload?.collected);
  mergeAppointment(session, normalized);

  const agentReply =
    assistantPayload?.reply?.trim() ||
    "Thanks for sharing that. Could you provide a bit more detail?";
  appendMessage(session, "assistant", agentReply);

  const appointmentComplete = isAppointmentComplete(session.appointment);
  let message = agentReply;
  let shouldEndCall = false;
  let formattedAppointment = null;

  if (appointmentComplete) {
    formattedAppointment = formatAppointmentForDatabase(session.appointment);
    const summary = summarizeAppointment(session.appointment);
    message = `${agentReply} Just to confirm, ${summary}. You'll receive a confirmation shortly.`;
    shouldEndCall = true;

    if (!session.appointmentPersisted) {
      // TODO: saveAppointmentToDatabase(formattedAppointment);
      session.appointmentPersisted = true;
    }
  }

  return {
    message: message.trim(),
    shouldEndCall,
    appointment: session.appointment,
    formattedAppointment,
    missingFields: getMissingFields(session.appointment),
  };
}

export function isAppointmentComplete(appointment = {}) {
  return REQUIRED_APPOINTMENT_FIELDS.every((field) =>
    Boolean(appointment?.[field])
  );
}

export function getMissingFields(appointment = {}) {
  return REQUIRED_APPOINTMENT_FIELDS.filter((field) => !appointment?.[field]);
}

export function formatAppointmentForDatabase(appointment = {}) {
  return {
    name: appointment.name?.trim(),
    email: appointment.email?.toLowerCase(),
    phone: appointment.phone,
    service: appointment.service,
    gender: appointment.gender,
    datetime: appointment.datetime,
    source: "twilio-voice",
  };
}

function summarizeAppointment(appointment = {}) {
  const service = appointment.service ?? "a service";
  const datetimeSpeech = formatDatetimeForSpeech(appointment.datetime);
  const name = appointment.name ?? "our guest";
  return `I have ${name} booked for ${service} on ${datetimeSpeech}`;
}

function formatDatetimeForSpeech(isoString) {
  if (!isoString) {
    return "an unspecified time";
  }
  try {
    const parsed = parseISO(isoString);
    if (isValid(parsed)) {
      return format(parsed, "eeee, MMMM do 'at' h:mm a");
    }
  } catch (error) {
    console.warn("Unable to format datetime:", isoString);
  }
  return isoString;
}

function normalizeCollectedData(collected = {}) {
  const normalized = {};

  if (collected.name) {
    normalized.name = titleCase(collected.name);
  }
  if (collected.email) {
    normalized.email = collected.email.trim().toLowerCase();
  }
  if (collected.phone) {
    normalized.phone = formatPhoneNumber(collected.phone);
  }
  if (collected.service) {
    normalized.service = collected.service.trim().toLowerCase();
  }
  if (collected.gender) {
    normalized.gender = collected.gender.trim().toLowerCase();
  }
  if (collected.datetime) {
    const normalizedDatetime = normalizeDatetime(collected.datetime);
    if (normalizedDatetime) {
      normalized.datetime = normalizedDatetime;
    }
  }

  return normalized;
}

export function normalizeDatetime(value) {
  if (!value) return null;
  const stringValue = String(value).trim();
  if (!stringValue) return null;

  try {
    const parsed = parseISO(stringValue);
    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  } catch (error) {
    // Swallow error and try fallback below.
  }

  const fallback = new Date(stringValue);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }

  return null;
}

function titleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatPhoneNumber(input = "") {
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : null;
}
