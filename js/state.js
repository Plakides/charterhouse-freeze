(() => {
  "use strict";

  const config = window.FREEZE_CONFIG || {};
  const SCHEMA_VERSION = Number(config.SCHEMA_VERSION) || 2;
  const GAME_KEY = "charterhouseFreeze.v2.game";
  const DEVICE_KEY = "charterhouseFreeze.v2.device";

  const LEGACY_KEYS = [
    "charterhouseFreeze.session.v1",
    "charterhouseFreeze.snapshot.v1"
  ];

  function nowIso() {
    return new Date().toISOString();
  }

  function deepClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function normaliseCompleted(values) {
    if (!Array.isArray(values)) return [];
    return Array.from(new Set(
      values
        .map(Number)
        .filter(value => Number.isInteger(value) && value >= 1 && value <= 8)
    )).sort((a, b) => a - b);
  }

  function normaliseSeals(values) {
    if (!Array.isArray(values)) return [];

    return values
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
      );
  }

  function normaliseTeam(team) {
    if (!team || typeof team !== "object") return null;

    const teamId = String(team.teamId || "").trim();
    const token = String(team.token || "").trim();

    if (!teamId) return null;

    const students = Array.isArray(team.students)
      ? team.students.map(value => String(value || "").trim()).filter(Boolean).slice(0, 4)
      : [];

    const completed = normaliseCompleted(team.completed);
    const seals = normaliseSeals(team.seals);

    return {
      teamId,
      token,
      teamName: String(team.teamName || "Emergency Team"),
      house: String(team.house || ""),
      houseName: String(team.houseName || ""),
      students,
      studentCount: students.length || Math.max(0, Number(team.studentCount) || 0),
      status: String(team.status || (team.startTime ? "ACTIVE" : "REGISTERED")),
      registeredTime: team.registeredTime || nowIso(),
      startTime: team.startTime || null,
      completed,
      completedCount: completed.length,
      seals,
      finishTime: team.finishTime || null,
      elapsedSeconds:
        team.elapsedSeconds === null || typeof team.elapsedSeconds === "undefined"
          ? null
          : Math.max(0, Number(team.elapsedSeconds) || 0),
      started: Boolean(team.started || team.startTime),
      finished: Boolean(team.finished || team.finishTime)
    };
  }

  function newSyncState(existing = {}) {
    return {
      enabled: Boolean(existing.enabled),
      queue: Array.isArray(existing.queue) ? existing.queue : [],
      lastAttempt: existing.lastAttempt || null,
      lastSuccess: existing.lastSuccess || null,
      lastError: existing.lastError || null
    };
  }

  function normaliseGame(value) {
    if (!value || typeof value !== "object") return null;

    const team = normaliseTeam(value.team);
    if (!team) return null;

    return {
      schemaVersion: SCHEMA_VERSION,
      createdAt: value.createdAt || nowIso(),
      updatedAt: value.updatedAt || nowIso(),
      deviceId: value.deviceId || getDeviceId(),
      team,
      sync: newSyncState(value.sync)
    };
  }

  function getDeviceId() {
    try {
      const existing = window.localStorage.getItem(DEVICE_KEY);
      if (existing) return existing;

      const id = `DEVICE-${randomId(12)}`;
      window.localStorage.setItem(DEVICE_KEY, id);
      return id;
    } catch (error) {
      console.warn("Could not persist device ID:", error);
      return `DEVICE-${randomId(12)}`;
    }
  }

  function randomId(length = 12) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(length);

    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
    }

    return Array.from(
      { length },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
  }

  function saveGame(value) {
    const game = normaliseGame(value);

    if (!game) {
      throw new Error("Cannot save invalid Charterhouse Freeze state.");
    }

    game.updatedAt = nowIso();
    window.localStorage.setItem(GAME_KEY, JSON.stringify(game));
    return deepClone(game);
  }

  function loadGame() {
    try {
      const raw = window.localStorage.getItem(GAME_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const game = normaliseGame(parsed);

      if (!game) {
        window.localStorage.removeItem(GAME_KEY);
        return null;
      }

      return game;
    } catch (error) {
      console.warn("Could not read local game state:", error);
      return null;
    }
  }

  function createGame(team) {
    const normalisedTeam = normaliseTeam(team);

    if (!normalisedTeam || !normalisedTeam.token) {
      throw new Error("Cannot create game without a team ID and local token.");
    }

    return saveGame({
      schemaVersion: SCHEMA_VERSION,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      deviceId: getDeviceId(),
      team: normalisedTeam,
      sync: {
        enabled: false,
        queue: [],
        lastAttempt: null,
        lastSuccess: null,
        lastError: null
      }
    });
  }

  function updateGame(mutator) {
    const current = loadGame();

    if (!current) {
      throw new Error("No local Charterhouse Freeze game exists on this device.");
    }

    const draft = deepClone(current);
    const result = typeof mutator === "function" ? mutator(draft) : draft;
    return saveGame(result || draft);
  }

  function toPublicTeam(team) {
    const value = normaliseTeam(team);
    if (!value) return null;

    const elapsedFromClock = value.startTime && !value.finished
      ? Math.max(0, Math.floor((Date.now() - new Date(value.startTime).getTime()) / 1000))
      : value.elapsedSeconds;

    return {
      teamId: value.teamId,
      teamName: value.teamName,
      house: value.house,
      houseName: value.houseName,
      studentCount: value.studentCount,
      status: value.status,
      registeredTime: value.registeredTime,
      startTime: value.startTime,
      completed: value.completed.slice(),
      completedCount: value.completed.length,
      seals: value.seals.map(seal => ({ ...seal })),
      started: value.started,
      finished: value.finished,
      finishTime: value.finishTime,
      elapsedSeconds: elapsedFromClock
    };
  }

  // ------------------------------------------------------------------
  // Compatibility surface used by the existing UI.
  // These methods now read/write the single canonical V2 local state.
  // ------------------------------------------------------------------
  function loadSession() {
    const game = loadGame();
    if (!game || !game.team.token) return null;

    return {
      teamId: game.team.teamId,
      token: game.team.token
    };
  }

  function saveSession(teamId, token) {
    const game = loadGame();
    const cleanTeamId = String(teamId || "").trim();
    const cleanToken = String(token || "").trim();

    if (!cleanTeamId || !cleanToken) {
      throw new Error("Cannot save an incomplete local session.");
    }

    if (game) {
      if (game.team.teamId !== cleanTeamId) {
        throw new Error("Local team ID does not match the saved game.");
      }

      if (game.team.token !== cleanToken) {
        updateGame(draft => {
          draft.team.token = cleanToken;
          return draft;
        });
      }
    }

    return { teamId: cleanTeamId, token: cleanToken };
  }

  function loadSnapshot(teamId) {
    const game = loadGame();
    if (!game) return null;

    if (teamId && game.team.teamId !== String(teamId).trim()) {
      return null;
    }

    return toPublicTeam(game.team);
  }

  function saveSnapshot(team) {
    const game = loadGame();
    if (!game || !team || !team.teamId) return null;

    if (game.team.teamId !== String(team.teamId).trim()) {
      return null;
    }

    const saved = updateGame(draft => {
      const incoming = normaliseTeam({
        ...draft.team,
        ...team,
        token: draft.team.token,
        students: draft.team.students
      });

      draft.team = incoming;
      return draft;
    });

    return toPublicTeam(saved.team);
  }

  function clearGame() {
    try {
      window.localStorage.removeItem(GAME_KEY);
      LEGACY_KEYS.forEach(key => window.localStorage.removeItem(key));
    } catch (error) {
      console.warn("Could not clear local Freeze state:", error);
    }
  }

  window.FREEZE_STATE = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    getDeviceId,
    loadGame,
    saveGame,
    createGame,
    updateGame,
    toPublicTeam,

    // Existing UI compatibility
    loadSession,
    saveSession,
    loadSnapshot,
    saveSnapshot,
    clearSnapshot() {},
    clearSession: clearGame,
    clearGame
  });
})();
