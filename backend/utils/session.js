const callSessions = new Map();

/**
 * Gets or creates a session for the given call SID
 */
export function getOrCreateSession(callSid) {
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

/**
 * Deletes a session for the given call SID
 */
export function deleteSession(callSid) {
  if (callSid) {
    callSessions.delete(callSid);
  }
}
