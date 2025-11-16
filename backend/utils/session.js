const callSessions = new Map();

const MAX_HISTORY = 12;

const emptyAppointment = () => ({
  name: null,
  email: null,
  phone: null,
  service: null,
  gender: null,
  datetime: null,
});

const createDefaultSession = () => ({
  stage: "greeting",
  appointment: emptyAppointment(),
  conversation: [],
  lastIntent: null,
  appointmentPersisted: false,
});

/**
 * Gets or creates a session for the given call SID
 */
export function getOrCreateSession(callSid) {
  if (!callSid) {
    return createDefaultSession();
  }

  if (!callSessions.has(callSid)) {
    callSessions.set(callSid, createDefaultSession());
  }

  return callSessions.get(callSid);
}

/**
 * Deletes a session for the given call SID
 */
export function deleteSession(callSid) {
  if (callSid) {
    callSessions.delete(callSid);
  }
}

export function appendMessage(session, role, content) {
  if (!session.conversation) {
    session.conversation = [];
  }
  session.conversation.push({ role, content });
  if (session.conversation.length > MAX_HISTORY) {
    session.conversation = session.conversation.slice(-MAX_HISTORY);
  }
}

export function mergeAppointment(session, partial = {}) {
  if (!session.appointment) {
    session.appointment = emptyAppointment();
  }

  Object.entries(partial).forEach(([key, value]) => {
    if (value && key in session.appointment) {
      session.appointment[key] = value;
    }
  });
}

export function resetAppointment(session) {
  session.appointment = emptyAppointment();
}
