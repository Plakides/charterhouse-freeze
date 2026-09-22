(() => {
  "use strict";

  const SESSION_KEY = "charterhouseFreeze.session.v1";
  const SNAPSHOT_KEY = "charterhouseFreeze.snapshot.v1";

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
      const raw = window.localStorage.getItem(SESSION_KEY);
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

    const existing = loadSession();

    if (existing && existing.teamId !== session.teamId) {
      clearSnapshot();
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function sanitiseSnapshot(team) {
    if (!team || typeof team !== "object" || !String(team.teamId || "").trim()) {
      return null;
    }

    const completed = Array.isArray(team.completed)
      ? team.completed
          .map(value => Number(value))
          .filter(value => Number.isInteger(value) && value >= 1 && value <= 8)
      : [];

    const seals = Array.isArray(team.seals)
      ? team.seals
          .map(seal => ({
            challengeId: Number(seal && seal.challengeId),
            symbol: String(seal && seal.symbol || ""),
            number: Number(seal && seal.number),
            label: String(seal && seal.label || "")
          }))
          .filter(seal =>
            Number.isInteger(seal.challengeId) &&
            seal.challengeId >= 1 &&
            seal.challengeId <= 8 &&
            seal.symbol &&
            Number.isFinite(seal.number)
          )
      : [];

    const studentCount = Array.isArray(team.students)
      ? team.students.length
      : Math.max(0, Number(team.studentCount) || 0);

    return {
      teamId: String(team.teamId).trim(),
      teamName: String(team.teamName || "Emergency Team"),
      house: String(team.house || ""),
      houseName: String(team.houseName || ""),
      studentCount,
      status: String(team.status || "REGISTERED"),
      registeredTime: team.registeredTime || null,
      startTime: team.startTime || null,
      completed,
      completedCount: Number.isFinite(Number(team.completedCount))
        ? Number(team.completedCount)
        : completed.length,
      seals,
      started: Boolean(team.started || team.startTime),
      finished: Boolean(team.finished),
      finishTime: team.finishTime || null,
      elapsedSeconds: team.elapsedSeconds === null ||
        typeof team.elapsedSeconds === "undefined"
        ? null
        : Number(team.elapsedSeconds),
      cachedAt: new Date().toISOString()
    };
  }

  function saveSnapshot(team) {
    try {
      const snapshot = sanitiseSnapshot(team);

      if (!snapshot) {
        return null;
      }

      window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
      return snapshot;
    } catch (error) {
      console.warn("Could not save Freeze team snapshot:", error);
      return null;
    }
  }

  function loadSnapshot(teamId) {
    try {
      const raw = window.localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const snapshot = sanitiseSnapshot(parsed);

      if (!snapshot) {
        clearSnapshot();
        return null;
      }

      if (teamId && snapshot.teamId !== String(teamId).trim()) {
        clearSnapshot();
        return null;
      }

      return snapshot;
    } catch (error) {
      console.warn("Could not read Freeze team snapshot:", error);
      return null;
    }
  }

  function clearSnapshot() {
    try {
      window.localStorage.removeItem(SNAPSHOT_KEY);
    } catch (error) {
      console.warn("Could not clear Freeze team snapshot:", error);
    }
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(SNAPSHOT_KEY);
    } catch (error) {
      console.warn("Could not clear saved Freeze session:", error);
    }
  }

  window.FREEZE_STATE = Object.freeze({
    loadSession,
    saveSession,
    loadSnapshot,
    saveSnapshot,
    clearSnapshot,
    clearSession
  });
})();
