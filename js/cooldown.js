(() => {
  "use strict";

  const STORAGE_KEY = "charterhouseFreeze.v2.wrongAnswerCooldowns";
  const DEFAULT_DURATION_MS = 30000;

  function now() {
    return Date.now();
  }

  function makeKey(teamId, challengeId) {
    return `${String(teamId || "").trim()}:${Number(challengeId)}`;
  }

  function loadAll() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};

      const parsed = JSON.parse(raw);

      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (error) {
      console.warn("Could not read wrong-answer cooldowns:", error);
      return {};
    }
  }

  function saveAll(values) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch (error) {
      console.warn("Could not save wrong-answer cooldowns:", error);
    }
  }

  function purgeExpired(values = loadAll()) {
    const current = now();
    let changed = false;

    Object.keys(values).forEach(key => {
      const until = Number(values[key]) || 0;

      if (until <= current) {
        delete values[key];
        changed = true;
      }
    });

    if (changed) {
      saveAll(values);
    }

    return values;
  }

  function start(teamId, challengeId, durationMs = DEFAULT_DURATION_MS) {
    const values = purgeExpired();
    const key = makeKey(teamId, challengeId);
    const duration = Math.max(
      1000,
      Number(durationMs) || DEFAULT_DURATION_MS
    );
    const until = now() + duration;

    values[key] = until;
    saveAll(values);

    return until;
  }

  function getUntil(teamId, challengeId) {
    const values = purgeExpired();

    return Math.max(
      0,
      Number(values[makeKey(teamId, challengeId)]) || 0
    );
  }

  function remainingMs(teamId, challengeId) {
    return Math.max(
      0,
      getUntil(teamId, challengeId) - now()
    );
  }

  function remainingSeconds(teamId, challengeId) {
    return Math.ceil(
      remainingMs(teamId, challengeId) / 1000
    );
  }

  function isActive(teamId, challengeId) {
    return remainingMs(teamId, challengeId) > 0;
  }

  function clear(teamId, challengeId) {
    const values = loadAll();
    const key = makeKey(teamId, challengeId);

    if (Object.prototype.hasOwnProperty.call(values, key)) {
      delete values[key];
      saveAll(values);
    }
  }

  function clearTeam(teamId) {
    const values = loadAll();
    const prefix = `${String(teamId || "").trim()}:`;
    let changed = false;

    Object.keys(values).forEach(key => {
      if (key.startsWith(prefix)) {
        delete values[key];
        changed = true;
      }
    });

    if (changed) {
      saveAll(values);
    }
  }

  function summary() {
    const values = purgeExpired();

    return Object.entries(values).map(([key, until]) => ({
      key,
      until: Number(until),
      remainingSeconds: Math.ceil(
        Math.max(0, Number(until) - now()) / 1000
      )
    }));
  }

  window.FREEZE_COOLDOWN = Object.freeze({
    durationMs: DEFAULT_DURATION_MS,
    start,
    getUntil,
    remainingMs,
    remainingSeconds,
    isActive,
    clear,
    clearTeam,
    summary
  });
})();
