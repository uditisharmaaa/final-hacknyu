/**
 * Detects user intent from speech input
 */
export function detectIntent(text = "", session) {
  if (
    session?.lastIntent === "booking" &&
    !isBookingComplete(session.booking)
  ) {
    return "booking";
  }

  const normalized = text.toLowerCase();
  if (
    containsKeyword(normalized, ["book", "appointment", "schedule", "reserve"])
  ) {
    return "booking";
  }
  if (
    containsKeyword(normalized, ["price", "cost", "service", "hours", "open"])
  ) {
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

/**
 * Handles detected intent and returns appropriate response
 */
export function handleIntent(session, intent, userSpeech) {
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

/**
 * Handles the booking flow conversation
 */
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

/**
 * Detects service type from user speech
 */
function detectService(text) {
  const services = [
    "haircut",
    "color",
    "balayage",
    "trim",
    "blowout",
    "treatment",
  ];
  return services.find((service) => text.includes(service));
}

/**
 * Checks if a booking has all required information
 */
function isBookingComplete(booking) {
  return Boolean(booking.service && booking.time && booking.name);
}

/**
 * Helper function to check if text contains any of the given keywords
 */
function containsKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

