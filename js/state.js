(() => {
  "use strict";

  const STORAGE_KEY = "charterhouseFreeze.session.v1";

  function isValidSession(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      typeof value.teamId === "string" &&
      value.teamId.trim() &&
      typeof value.token === "string" &&
      value.token.trim()
    );
  }

  function loadSession() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!isValidSession(parsed)) {
        clearSession();
        return null;
      }

      return {
        teamId: parsed.teamId.trim(),
        token: parsed.token.trim()
      };
    } catch (error) {
      console.warn("Could not read saved Freeze session:", error);
      return null;
    }
  }

  function saveSession(teamId, token) {
    const session = {
      teamId: String(teamId || "").trim(),
      token: String(token || "").trim()
    };

    if (!isValidSession(session)) {
      throw new Error("Cannot save an incomplete Freeze session.");
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Could not clear saved Freeze session:", error);
    }
  }

  window.FREEZE_STATE = Object.freeze({
    loadSession,
    saveSession,
    clearSession
  });
})();
