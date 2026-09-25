(() => {
  "use strict";

  const config = window.FREEZE_CONFIG || {};
  const SCHEMA_VERSION = Number(config.SCHEMA_VERSION) || 2;
  const GAME_KEY = "charterhouseFreeze.v2.game";
  const BACKUP_KEY = "charterhouseFreeze.v2.backup";
  const QUARANTINE_KEY = "charterhouseFreeze.v2.corrupt";
  const RECOVERY_INFO_KEY = "charterhouseFreeze.v2.recoveryInfo";
  const DEVICE_KEY = "charterhouseFreeze.v2.device";

  let lastRecoveryInfo = {
    status: "not-checked",
    source: null,
    migratedFrom: null,
    recoveredAt: null,
    issue: null
  };

  const LEGACY_KEYS = [
    "charterhouseFreeze.session.v1",
    "charterhouseFreeze.snapshot.v1"
  ];

  function setRecoveryInfo(info) {
    lastRecoveryInfo = {
      status: info?.status || "ok",
      source: info?.source || null,
      migratedFrom: info?.migratedFrom ?? null,
      recoveredAt: info?.recoveredAt || null,
      issue: info?.issue || null
    };

    try {
      window.localStorage.setItem(
        RECOVERY_INFO_KEY,
        JSON.stringify(lastRecoveryInfo)
      );
    } catch (error) {
      console.warn("Could not persist recovery information:", error);
    }

    return lastRecoveryInfo;
  }

  function restoreRecoveryInfo() {
    try {
      const raw = window.localStorage.getItem(RECOVERY_INFO_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        lastRecoveryInfo = { ...lastRecoveryInfo, ...parsed };
      }
    } catch (error) {
      console.warn("Could not restore recovery information:", error);
    }
  }

  restoreRecoveryInfo();

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
    const queue = Array.isArray(existing.queue)
      ? existing.queue
          .filter(item => item && typeof item === "object")
          .map(item => ({ ...item }))
      : [];

    const maxQueuedSeq = queue.reduce(
      (maximum, item) => Math.max(maximum, Number(item.seq) || 0),
      0
    );

    return {
      enabled: Boolean(existing.enabled),
      nextSeq: Math.max(
        1,
        Number(existing.nextSeq) || 1,
        maxQueuedSeq + 1
      ),
      queue,
      lastAttempt: existing.lastAttempt || null,
      lastSuccess: existing.lastSuccess || null,
      lastError: existing.lastError || null
    };
  }

  function normaliseGame(value) {
    if (!value || typeof value !== "object") return null;

    const incomingSchema = Number(value.schemaVersion || 1);

    // Never guess how to interpret data written by a future build.
    if (!Number.isFinite(incomingSchema) || incomingSchema > SCHEMA_VERSION) {
      return null;
    }

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

  function tryParseGame(raw) {
    if (!raw) {
      return { ok: false, reason: "missing", game: null, incomingSchema: null };
    }

    try {
      const parsed = JSON.parse(raw);
      const incomingSchema = Number(parsed?.schemaVersion || 1);

      if (Number.isFinite(incomingSchema) && incomingSchema > SCHEMA_VERSION) {
        return {
          ok: false,
          reason: "future-schema",
          game: null,
          incomingSchema
        };
      }

      const game = normaliseGame(parsed);
      if (!game) {
        return {
          ok: false,
          reason: "invalid-shape",
          game: null,
          incomingSchema
        };
      }

      return {
        ok: true,
        reason: incomingSchema < SCHEMA_VERSION ? "migrated" : "ok",
        game,
        incomingSchema
      };
    } catch (error) {
      return {
        ok: false,
        reason: "invalid-json",
        game: null,
        incomingSchema: null,
        error
      };
    }
  }

  function quarantineRaw(raw, reason) {
    if (!raw) return;

    try {
      window.localStorage.setItem(
        QUARANTINE_KEY,
        JSON.stringify({
          quarantinedAt: nowIso(),
          reason: String(reason || "unknown"),
          raw: String(raw)
        })
      );
    } catch (error) {
      console.warn("Could not quarantine damaged local state:", error);
    }
  }

  function writeCanonicalGame(game) {
    window.localStorage.setItem(GAME_KEY, JSON.stringify(game));
  }

  function saveGame(value) {
    const game = normaliseGame(value);

    if (!game) {
      throw new Error("Cannot save invalid Charterhouse Freeze state.");
    }

    game.updatedAt = nowIso();

    // Preserve the previous valid snapshot before every meaningful write.
    // If the new primary value is later damaged, the last-known-good copy is
    // at most one local mutation behind.
    try {
      const currentRaw = window.localStorage.getItem(GAME_KEY);
      const current = tryParseGame(currentRaw);

      if (current.ok) {
        window.localStorage.setItem(
          BACKUP_KEY,
          JSON.stringify(current.game)
        );
      }
    } catch (error) {
      console.warn("Could not update local backup:", error);
    }

    writeCanonicalGame(game);
    if (!["recovered", "migrated", "unsupported-future"].includes(lastRecoveryInfo.status)) {
      setRecoveryInfo({
        status: "ok",
        source: "primary",
        migratedFrom: null,
        recoveredAt: null,
        issue: null
      });
    }

    return deepClone(game);
  }

  function loadGame() {
    let primaryRaw = null;
    let backupRaw = null;

    try {
      primaryRaw = window.localStorage.getItem(GAME_KEY);
      backupRaw = window.localStorage.getItem(BACKUP_KEY);

      const primary = tryParseGame(primaryRaw);

      if (primary.ok) {
        const migratedFrom =
          primary.incomingSchema < SCHEMA_VERSION
            ? primary.incomingSchema
            : null;

        if (migratedFrom !== null) {
          // Upgrade older valid state in place without disturbing the backup.
          writeCanonicalGame(primary.game);
        }

        if (migratedFrom !== null) {
          setRecoveryInfo({
            status: "migrated",
            source: "primary",
            migratedFrom,
            recoveredAt: nowIso(),
            issue: null
          });
        } else if (!["recovered", "migrated"].includes(lastRecoveryInfo.status)) {
          setRecoveryInfo({
            status: "ok",
            source: "primary",
            migratedFrom: null,
            recoveredAt: null,
            issue: null
          });
        }

        return deepClone(primary.game);
      }

      if (primary.reason === "future-schema") {
        setRecoveryInfo({
          status: "unsupported-future",
          source: "primary",
          migratedFrom: primary.incomingSchema,
          recoveredAt: null,
          issue: "future-schema"
        });
        return null;
      }

      const backup = tryParseGame(backupRaw);

      if (backup.ok) {
        if (primaryRaw) {
          quarantineRaw(primaryRaw, primary.reason);
        }

        // Restore directly, rather than calling saveGame(), so the damaged
        // primary cannot replace the good backup.
        writeCanonicalGame(backup.game);

        setRecoveryInfo({
          status: "recovered",
          source: "backup",
          migratedFrom:
            backup.incomingSchema < SCHEMA_VERSION
              ? backup.incomingSchema
              : null,
          recoveredAt: nowIso(),
          issue: primary.reason
        });

        return deepClone(backup.game);
      }

      if (primaryRaw) {
        quarantineRaw(primaryRaw, primary.reason);
      }

      setRecoveryInfo({
        status: primaryRaw || backupRaw ? "unrecoverable" : "empty",
        source: null,
        migratedFrom: null,
        recoveredAt: null,
        issue: primaryRaw ? primary.reason : null
      });

      return null;
    } catch (error) {
      console.warn("Could not read local game state:", error);

      setRecoveryInfo({
        status: "error",
        source: null,
        migratedFrom: null,
        recoveredAt: null,
        issue: String(error?.message || error)
      });

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
        nextSeq: 1,
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


  function completeChallenge(challengeId, seal) {
    const id = Number(challengeId);

    if (!Number.isInteger(id) || id < 1 || id > 8) {
      throw new Error("Invalid challenge ID.");
    }

    if (
      !seal ||
      Number(seal.challengeId) !== id ||
      !String(seal.symbol || "").trim() ||
      !Number.isFinite(Number(seal.number))
    ) {
      throw new Error("Invalid security seal.");
    }

    return updateGame(draft => {
      if (!draft.team.started) {
        throw new Error("Mission has not started.");
      }

      const completed = new Set(normaliseCompleted(draft.team.completed));
      completed.add(id);
      draft.team.completed = Array.from(completed).sort((a, b) => a - b);

      const seals = normaliseSeals(draft.team.seals)
        .filter(existing => Number(existing.challengeId) !== id);

      seals.push({
        challengeId: id,
        symbol: String(seal.symbol),
        number: Number(seal.number),
        label: String(seal.label || "")
      });

      seals.sort((a, b) => a.challengeId - b.challengeId);
      draft.team.seals = seals;
      draft.team.status = draft.team.completed.length >= 8 ? "VAULT_READY" : "ACTIVE";

      return draft;
    });
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

  function getRecoveryInfo() {
    return deepClone(lastRecoveryInfo);
  }

  function inspectStorage() {
    let primaryRaw = null;
    let backupRaw = null;
    let quarantineRawValue = null;

    try {
      primaryRaw = window.localStorage.getItem(GAME_KEY);
      backupRaw = window.localStorage.getItem(BACKUP_KEY);
      quarantineRawValue = window.localStorage.getItem(QUARANTINE_KEY);
    } catch (error) {
      return {
        ok: false,
        schemaVersion: SCHEMA_VERSION,
        primary: "unavailable",
        backup: "unavailable",
        quarantine: false,
        recovery: getRecoveryInfo(),
        error: String(error?.message || error)
      };
    }

    const primary = tryParseGame(primaryRaw);
    const backup = tryParseGame(backupRaw);

    return {
      ok: primary.ok || backup.ok || (!primaryRaw && !backupRaw),
      schemaVersion: SCHEMA_VERSION,
      primary: primaryRaw ? (primary.ok ? "valid" : primary.reason) : "empty",
      backup: backupRaw ? (backup.ok ? "valid" : backup.reason) : "empty",
      quarantine: Boolean(quarantineRawValue),
      recovery: getRecoveryInfo()
    };
  }

  function clearGame() {
    try {
      window.localStorage.removeItem(GAME_KEY);
      window.localStorage.removeItem(BACKUP_KEY);
      window.localStorage.removeItem(QUARANTINE_KEY);
      window.localStorage.removeItem(RECOVERY_INFO_KEY);
      LEGACY_KEYS.forEach(key => window.localStorage.removeItem(key));
      lastRecoveryInfo = {
        status: "empty",
        source: null,
        migratedFrom: null,
        recoveredAt: null,
        issue: null
      };
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
    completeChallenge,
    toPublicTeam,
    inspectStorage,
    getRecoveryInfo,

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
