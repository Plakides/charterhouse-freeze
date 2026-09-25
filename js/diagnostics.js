(() => {
  "use strict";

  const stateStore = window.FREEZE_STATE;
  const syncQueue = window.FREEZE_SYNC_QUEUE;
  const syncTransport = window.FREEZE_SYNC_TRANSPORT;
  const recovery = window.FREEZE_RECOVERY;

  const overlay = document.getElementById("teacherDiagnosticsOverlay");
  const openButton = document.getElementById("teacherDiagnosticsButton");
  const closeButtons = overlay?.querySelectorAll("[data-diagnostics-close]") || [];
  const refreshButton = document.getElementById("diagnosticsRefreshButton");
  const syncButton = document.getElementById("diagnosticsSyncButton");
  const copyButton = document.getElementById("diagnosticsCopyButton");
  const resetInput = document.getElementById("diagnosticsResetInput");
  const resetButton = document.getElementById("diagnosticsResetButton");
  const resultCode = document.getElementById("diagnosticsResultCode");
  const copyResultButton = document.getElementById("diagnosticsCopyResultButton");
  const message = document.getElementById("diagnosticsMessage");

  let previousFocus = null;

  function formatDate(value) {
    if (!value) return "Never";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function formatElapsed(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }

  function setValue(name, value, state = "normal") {
    const element = overlay?.querySelector(`[data-diagnostic-value="${name}"]`);
    if (!element) return;
    element.textContent = value;
    element.dataset.state = state;
  }

  async function offlineStatus() {
    if (!window.FREEZE_OFFLINE?.check) {
      return { label: "Unavailable", state: "warning" };
    }

    try {
      const ready = await window.FREEZE_OFFLINE.check();
      return ready
        ? { label: "Ready", state: "good" }
        : { label: "Incomplete", state: "warning" };
    } catch {
      return { label: "Check failed", state: "warning" };
    }
  }

  async function refresh() {
    if (!overlay) return;

    const game = stateStore?.loadGame?.() || null;
    const storage = stateStore?.inspectStorage?.() || {};
    const queue = syncQueue?.summary?.() || {};
    const transport = syncTransport?.status?.() || {};
    const offline = await offlineStatus();
    const team = game?.team || null;

    const localLabel = storage.primary === "valid"
      ? `OK · schema ${storage.schemaVersion}`
      : storage.backup === "valid"
        ? `Backup available · schema ${storage.schemaVersion}`
        : storage.primary === "empty"
          ? "No local mission"
          : `Problem · ${storage.primary || "unknown"}`;

    const localState = storage.primary === "valid"
      ? "good"
      : storage.backup === "valid"
        ? "warning"
        : storage.primary === "empty"
          ? "normal"
          : "bad";

    setValue("local", localLabel, localState);
    setValue(
      "recovery",
      storage.recovery?.status === "recovered"
        ? `Recovered from backup · ${formatDate(storage.recovery.recoveredAt)}`
        : storage.recovery?.status === "migrated"
          ? `Migrated from schema ${storage.recovery.migratedFrom}`
          : storage.recovery?.status === "unsupported-future"
            ? `Newer schema ${storage.recovery.migratedFrom} detected; state left untouched`
          : storage.quarantine
            ? "Damaged copy quarantined"
            : "No recovery action needed",
      storage.recovery?.status === "recovered" ? "warning" : "normal"
    );
    setValue("offline", offline.label, offline.state);
    setValue(
      "network",
      navigator.onLine ? "Browser online" : "Browser offline",
      navigator.onLine ? "good" : "warning"
    );
    setValue(
      "queue",
      `${Number(queue.queued) || 0} pending update${Number(queue.queued) === 1 ? "" : "s"}`,
      Number(queue.queued) > 0 ? "warning" : "good"
    );
    setValue("lastSync", formatDate(queue.lastSuccess));
    setValue("lastAttempt", formatDate(queue.lastAttempt));
    setValue(
      "lastError",
      queue.lastError || "None",
      queue.lastError ? "bad" : "good"
    );
    setValue(
      "transport",
      transport.enabled
        ? `Enabled · ${Math.round((transport.timeoutMs || 0) / 100) / 10}s timeout`
        : "Disabled",
      transport.enabled ? "good" : "warning"
    );

    if (team) {
      const completed = Number(team.completedCount ?? team.completed?.length) || 0;
      const elapsed = recovery?.elapsedSeconds?.(team) || 0;
      setValue("team", `${team.teamName} · ${team.teamId}`);
      setValue("house", team.houseName || team.house || "Unknown");
      setValue("progress", `${completed}/8 · ${formatElapsed(elapsed)}`);
      setValue("status", team.finished ? "FINISHED" : team.started ? "ACTIVE" : "REGISTERED");
      if (resultCode) resultCode.textContent = recovery.createResultCode(team);
    } else {
      setValue("team", "No local team");
      setValue("house", "—");
      setValue("progress", "—");
      setValue("status", "—");
      if (resultCode) resultCode.textContent = "NO-RESULT";
    }

    setValue("device", stateStore?.getDeviceId?.() || "Unavailable");
    setValue("build", "9A2 · schema 3");
  }

  function open() {
    if (!overlay) return;
    previousFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      overlay.querySelector(".modal-close")?.focus();
    });
    refresh();
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove("is-open");
    window.setTimeout(() => {
      overlay.hidden = true;
      document.body.classList.remove("modal-open");
      previousFocus?.focus?.();
    }, 180);
  }

  function diagnosticReport() {
    const game = stateStore?.loadGame?.() || null;
    const storage = stateStore?.inspectStorage?.() || {};
    const queue = syncQueue?.summary?.() || {};
    const transport = syncTransport?.status?.() || {};
    const team = game?.team || null;

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      build: "9A2",
      schemaVersion: stateStore?.schemaVersion || null,
      browserOnline: navigator.onLine,
      storage,
      sync: {
        queued: queue.queued || 0,
        lastAttempt: queue.lastAttempt || null,
        lastSuccess: queue.lastSuccess || null,
        lastError: queue.lastError || null,
        enabled: Boolean(transport.enabled),
        endpoint: transport.endpoint || null
      },
      team: team ? {
        teamId: team.teamId,
        teamName: team.teamName,
        house: team.house,
        completedCount: Number(team.completedCount ?? team.completed?.length) || 0,
        started: Boolean(team.started),
        finished: Boolean(team.finished),
        elapsedSeconds: recovery?.elapsedSeconds?.(team) || 0,
        resultCode: recovery?.createResultCode?.(team) || null
      } : null
    }, null, 2);
  }

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      if (message) message.textContent = successMessage;
    } catch {
      if (message) message.textContent = "Clipboard blocked. Select and copy the text manually.";
    }
  }

  openButton?.addEventListener("click", open);
  closeButtons.forEach(button => button.addEventListener("click", close));

  overlay?.addEventListener("mousedown", event => {
    if (event.target === overlay) close();
  });

  document.addEventListener("keydown", event => {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      open();
      return;
    }

    if (!overlay?.hidden && event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });

  refreshButton?.addEventListener("click", refresh);

  syncButton?.addEventListener("click", async () => {
    if (message) message.textContent = "Trying leaderboard sync…";

    try {
      const result = await syncTransport.flush({ silent: false });
      if (message) {
        if (result.skipped === "offline") {
          message.textContent = `Browser offline. ${result.remaining || 0} update(s) remain safely queued.`;
        } else if (result.skipped) {
          message.textContent = `Sync not sent (${result.skipped}). ${result.remaining || 0} update(s) remain queued.`;
        } else {
          message.textContent = result.remaining
            ? `Sync completed. ${result.remaining} newer update(s) still queued.`
            : "Sync successful. Queue is clear.";
        }
      }
    } catch (error) {
      if (message) message.textContent = `Sync failed safely: ${error.message}`;
    }

    refresh();
  });

  copyButton?.addEventListener("click", () => {
    copyText(diagnosticReport(), "Diagnostic report copied.");
  });

  copyResultButton?.addEventListener("click", () => {
    const game = stateStore?.loadGame?.();
    if (!game?.team) {
      if (message) message.textContent = "No local team to copy.";
      return;
    }

    copyText(
      recovery.createRecoverySummary(game.team),
      "Emergency result copied."
    );
  });

  resetInput?.addEventListener("input", () => {
    resetButton.disabled = resetInput.value.trim().toUpperCase() !== "RESET";
  });

  resetButton?.addEventListener("click", () => {
    if (resetInput.value.trim().toUpperCase() !== "RESET") return;

    stateStore.clearGame();
    window.location.replace(
      window.location.pathname + "?reset=1"
    );
  });

  window.addEventListener("online", () => {
    if (!overlay?.hidden) refresh();
  });
  window.addEventListener("offline", () => {
    if (!overlay?.hidden) refresh();
  });

  window.FREEZE_DIAGNOSTICS = Object.freeze({
    open,
    close,
    refresh,
    report: diagnosticReport
  });
})();
