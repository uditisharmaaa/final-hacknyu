/**
 * WhatsApp Messaging Service
 * Sends appointment confirmations via Twilio WhatsApp with Google Calendar links
 */
import twilio from "twilio";
import { addMinutes, format, isValid, parseISO } from "date-fns";

const DEFAULT_EVENT_DURATION_MINUTES = 60;
const SALON_NAME = process.env.SALON_NAME || "Luna Hair Studio";

let cachedTwilioClient = null;

function getTwilioClient() {
  if (cachedTwilioClient) {
    return cachedTwilioClient;
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn(
      "Twilio credentials are not configured. Skipping SMS confirmation."
    );
    return null;
  }

  cachedTwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return cachedTwilioClient;
}

function formatForGoogle(date) {
  return format(date, "yyyyMMdd'T'HHmmss");
}

export function createGoogleCalendarLink(appointment = {}) {
  const { datetime, service, name } = appointment;
  let startDate = null;

  if (datetime) {
    const parsed = parseISO(datetime);
    if (isValid(parsed)) {
      startDate = parsed;
    }
  }

  if (!startDate) {
    startDate = new Date();
  }

  const endDate = addMinutes(
    startDate,
    appointment.durationMinutes || DEFAULT_EVENT_DURATION_MINUTES
  );

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Hair Appointment - ${service ?? "Salon Service"}`,
    dates: `${formatForGoogle(startDate)}/${formatForGoogle(endDate)}`,
    details: `Hair appointment for ${name ?? "our guest"} at ${SALON_NAME}`,
    location: appointment.location ?? SALON_NAME,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Sends appointment confirmation via WhatsApp with Google Calendar link
 * DEMO MODE: If DEMO_WHATSAPP_NUMBER is set, sends to that number instead
 */
export async function sendAppointmentSMS(
  appointment = {},
  toPhoneNumber,
  options = {}
) {
  const trimmedPhone = (toPhoneNumber ?? "").trim();

  if (!trimmedPhone) {
    console.warn("sendAppointmentSMS skipped: missing recipient phone number");
    return false;
  }

  const client = getTwilioClient();
  if (!client) {
    return false;
  }

  const { datetime, name, service } = appointment;

  let formattedDate = "your scheduled time";
  if (datetime) {
    const parsed = parseISO(datetime);
    if (isValid(parsed)) {
      formattedDate = format(parsed, "EEEE, MMMM d 'at' h:mm a");
    }
  }

  const calendarLink = createGoogleCalendarLink(appointment);
  const messageBody = [
    `🎉 ${SALON_NAME} confirmation`,
    `${name ?? "Friend"}, your ${
      service ?? "appointment"
    } is booked for ${formattedDate}.`,
    `Add to calendar: ${calendarLink}`,
  ].join("\n");

  // DEMO MODE: Send to your test number instead of the actual caller
  const DEMO_WHATSAPP_NUMBER = process.env.DEMO_WHATSAPP_NUMBER || null;
  let recipientPhone = trimmedPhone;

  if (DEMO_WHATSAPP_NUMBER) {
    console.log(
      `[DEMO MODE] Redirecting WhatsApp from ${trimmedPhone} to ${DEMO_WHATSAPP_NUMBER}`
    );
    recipientPhone = DEMO_WHATSAPP_NUMBER;
  }

  // Normalize phone number format (ensure it has + and country code)
  let normalizedPhone = recipientPhone.trim();
  if (
    !normalizedPhone.startsWith("+") &&
    !normalizedPhone.startsWith("whatsapp:")
  ) {
    // Remove any non-digit characters
    const digits = normalizedPhone.replace(/\D/g, "");
    // Add country code if missing
    if (digits.startsWith("1") && digits.length === 11) {
      normalizedPhone = "+" + digits;
    } else if (digits.length === 10) {
      normalizedPhone = "+1" + digits;
    } else {
      normalizedPhone = "+" + digits;
    }
  }

  // Format for WhatsApp (add whatsapp: prefix)
  const whatsappTo = normalizedPhone.startsWith("whatsapp:")
    ? normalizedPhone
    : `whatsapp:${normalizedPhone}`;
  const whatsappFrom = process.env.TWILIO_PHONE_NUMBER?.startsWith("whatsapp:")
    ? process.env.TWILIO_PHONE_NUMBER
    : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

  try {
    console.log(
      `[WHATSAPP] Sending appointment confirmation from ${whatsappFrom} to ${whatsappTo}`
    );
    await client.messages.create({
      body: messageBody,
      to: whatsappTo,
      from: whatsappFrom,
      ...options,
    });
    console.log(`Appointment confirmation WhatsApp sent to ${whatsappTo}`);
    return true;
  } catch (error) {
    console.error("Failed to send appointment WhatsApp:", error);
    return false;
  }
}
