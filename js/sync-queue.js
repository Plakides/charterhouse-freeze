(() => {
  "use strict";

  const stateStore = window.FREEZE_STATE;

  if (!stateStore) {
    throw new Error("FREEZE_STATE must load before FREEZE_SYNC_QUEUE.");
  }

  const VALID_TYPES = Object.freeze([
    "REGISTER",
    "START",
    "PROGRESS",
    "FINISH"
  ]);

  function nowIso() {
    return new Date().toISOString();
  }

  function randomSuffix(length = 6) {
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

  function deepClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function elapsedSeconds(team) {
    if (!team || !team.startTime) return 0;

    if (team.finished && Number.isFinite(Number(team.elapsedSeconds))) {
      return Math.max(0, Math.floor(Number(team.elapsedSeconds)));
    }

    const start = new Date(team.startTime).getTime();
    if (!Number.isFinite(start)) return 0;

    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  }

  function buildLeaderboardSnapshot(game) {
    if (!game || !game.team) {
      throw new Error("Cannot queue sync without local game state.");
    }

    const team = game.team;
    const completed = Array.isArray(team.completed)
      ? Array.from(new Set(
          team.completed
            .map(Number)
            .filter(value => Number.isInteger(value) && value >= 1 && value <= 8)
        )).sort((a, b) => a - b)
      : [];

    return {
      teamId: String(team.teamId || ""),
      teamName: String(team.teamName || "Emergency Team"),
      house: String(team.house || ""),
      completedCount: completed.length,
      elapsedSeconds: elapsedSeconds(team),
      finished: Boolean(team.finished),
      finishTime: team.finishTime || null
    };
  }

  function makeEvent(type, seq, game) {
    const snapshot = buildLeaderboardSnapshot(game);

    return {
      eventId: `${snapshot.teamId}-${seq}-${randomSuffix()}`,
      seq,
      type,
      createdAt: nowIso(),
      ...snapshot
    };
  }

  function assertType(type) {
    const value = String(type || "").trim().toUpperCase();

    if (!VALID_TYPES.includes(value)) {
      throw new Error(`Invalid sync event type: ${value || "(blank)"}`);
    }

    return value;
  }

  function enqueue(type) {
    const eventType = assertType(type);
    const current = stateStore.loadGame();

    if (!current) {
      throw new Error("Cannot queue sync before a local team exists.");
    }

    let queuedEvent = null;

    const saved = stateStore.updateGame(draft => {
      const sync = draft.sync || {};
      const queue = Array.isArray(sync.queue)
        ? sync.queue.filter(item => item && typeof item === "object")
        : [];

      const seq = Math.max(1, Number(sync.nextSeq) || 1);
      queuedEvent = makeEvent(eventType, seq, draft);

      // Registration/start/finish are milestones.
      // Progress is "latest state wins", so keep at most one unsent PROGRESS.
      const nextQueue = eventType === "PROGRESS"
        ? queue.filter(item => item.type !== "PROGRESS")
        : queue;

      nextQueue.push(queuedEvent);
      nextQueue.sort((left, right) => Number(left.seq) - Number(right.seq));

      draft.sync = {
        ...sync,
        nextSeq: seq + 1,
        queue: nextQueue
      };

      return draft;
    });

    return {
      event: deepClone(queuedEvent),
      queue: deepClone(saved.sync.queue)
    };
  }

  function getQueue() {
    const game = stateStore.loadGame();
    return game && game.sync && Array.isArray(game.sync.queue)
      ? deepClone(game.sync.queue)
      : [];
  }

  function peek(limit = 10) {
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
    return getQueue().slice(0, safeLimit);
  }

  function acknowledge(eventIds) {
    const ids = new Set(
      (Array.isArray(eventIds) ? eventIds : [eventIds])
        .map(value => String(value || "").trim())
        .filter(Boolean)
    );

    if (!ids.size) return getQueue();

    const saved = stateStore.updateGame(draft => {
      const sync = draft.sync || {};
      const queue = Array.isArray(sync.queue) ? sync.queue : [];

      draft.sync = {
        ...sync,
        queue: queue.filter(item => !ids.has(String(item.eventId || ""))),
        lastSuccess: nowIso(),
        lastError: null
      };

      return draft;
    });

    return deepClone(saved.sync.queue);
  }

  function markAttempt() {
    const saved = stateStore.updateGame(draft => {
      draft.sync = {
        ...(draft.sync || {}),
        lastAttempt: nowIso()
      };
      return draft;
    });

    return deepClone(saved.sync);
  }

  function markError(message) {
    const saved = stateStore.updateGame(draft => {
      draft.sync = {
        ...(draft.sync || {}),
        lastError: String(message || "Unknown sync error")
      };
      return draft;
    });

    return deepClone(saved.sync);
  }

  function summary() {
    const game = stateStore.loadGame();
    const sync = game && game.sync ? game.sync : {};
    const queue = Array.isArray(sync.queue) ? sync.queue : [];

    return {
      queued: queue.length,
      nextSeq: Math.max(1, Number(sync.nextSeq) || 1),
      lastAttempt: sync.lastAttempt || null,
      lastSuccess: sync.lastSuccess || null,
      lastError: sync.lastError || null,
      transportEnabled: Boolean(sync.enabled)
    };
  }

  window.FREEZE_SYNC_QUEUE = Object.freeze({
    enqueue,
    getQueue,
    peek,
    acknowledge,
    markAttempt,
    markError,
    summary
  });
})();
