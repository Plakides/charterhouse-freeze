(() => {
  "use strict";

  const config = window.FREEZE_CONFIG || {};
  const queue = window.FREEZE_SYNC_QUEUE;

  if (!queue) {
    throw new Error("FREEZE_SYNC_QUEUE must load before FREEZE_SYNC_TRANSPORT.");
  }

  const timeoutMs = Math.max(750, Number(config.SYNC_TIMEOUT_MS) || 2500);
  const intervalMs = Math.max(30000, Number(config.SYNC_INTERVAL_MS) || 45000);

  let intervalId = null;
  let flushing = false;
  let started = false;

  function endpoint(path) {
    const base = String(config.SYNC_URL || "").trim().replace(/\/+$/, "");
    return base ? `${base}${path}` : "";
  }

  function transportEnabled() {
    return config.SYNC_ENABLED === true && Boolean(endpoint(""));
  }

  function isBrowserOffline() {
    return typeof navigator !== "undefined" && navigator.onLine === false;
  }

  async function postEvents(events) {
    const url = endpoint("/sync");

    if (!url) {
      throw new Error("Leaderboard sync URL is not configured.");
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",

        // Deliberately text/plain rather than application/json:
        // this avoids an extra CORS preflight request on poor connections.
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        },

        body: JSON.stringify({ events }),
        cache: "no-store",
        credentials: "omit",
        keepalive: true,
        signal: controller.signal
      });

      const text = await response.text();
      let body;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(
          `Leaderboard returned unreadable data (${response.status}).`
        );
      }

      if (!response.ok || !body?.ok) {
        const message =
          body?.error?.message ||
          `Leaderboard sync failed (${response.status}).`;

        throw new Error(message);
      }

      return body;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function flush(options = {}) {
    const silent = options.silent !== false;

    if (!transportEnabled()) {
      return {
        ok: false,
        skipped: "disabled",
        remaining: queue.getQueue().length
      };
    }

    if (flushing) {
      return {
        ok: false,
        skipped: "already-flushing",
        remaining: queue.getQueue().length
      };
    }

    const events = queue.peek(25);

    if (!events.length) {
      return {
        ok: true,
        sent: 0,
        remaining: 0
      };
    }

    // Do not waste two-and-a-half seconds on a request the browser already
    // knows cannot leave the device. The "online" event will retry later.
    if (isBrowserOffline()) {
      return {
        ok: false,
        skipped: "offline",
        remaining: events.length
      };
    }

    flushing = true;
    queue.markAttempt();

    try {
      const result = await postEvents(events);

      // Duplicate/stale events are still safely acknowledged by the server,
      // so they can be removed from this device's queue.
      const acknowledgedIds = Array.isArray(result.results)
        ? result.results
            .map(item => String(item?.eventId || "").trim())
            .filter(Boolean)
        : events.map(item => item.eventId);

      queue.acknowledge(acknowledgedIds);

      const remaining = queue.getQueue().length;

      // A newer event may have been queued while this request was travelling.
      // If so, try it shortly afterwards without making gameplay wait.
      if (remaining > 0) {
        requestFlush(250);
      }

      return {
        ok: true,
        sent: acknowledgedIds.length,
        remaining,
        server: result
      };
    } catch (error) {
      const message = error?.name === "AbortError"
        ? `Leaderboard sync timed out after ${timeoutMs} ms.`
        : String(
            error?.message ||
            error ||
            "Unknown leaderboard sync error."
          );

      queue.markError(message);

      if (!silent) {
        throw new Error(message);
      }

      return {
        ok: false,
        error: message,
        remaining: queue.getQueue().length
      };
    } finally {
      flushing = false;
    }
  }

  function requestFlush(delayMs = 0) {
    if (!transportEnabled()) return;

    window.setTimeout(() => {
      flush({ silent: true });
    }, Math.max(0, Number(delayMs) || 0));
  }

  function handleOnline() {
    requestFlush(200);
  }

  function handleFocus() {
    requestFlush(250);
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      requestFlush(250);
    }
  }

  function start() {
    if (started) return;
    started = true;

    if (!transportEnabled()) return;

    // Existing offline queue gets a chance to catch up shortly after load.
    requestFlush(600);

    intervalId = window.setInterval(() => {
      flush({ silent: true });
    }, intervalMs);

    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  function stop() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    window.removeEventListener("online", handleOnline);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    started = false;
  }

  function status() {
    return {
      enabled: transportEnabled(),
      endpoint: endpoint("/sync") || null,
      browserOnline: !isBrowserOffline(),
      timeoutMs,
      intervalMs,
      flushing,
      started,
      ...queue.summary()
    };
  }

  window.FREEZE_SYNC_TRANSPORT = Object.freeze({
    start,
    stop,
    flush,
    requestFlush,
    status
  });
})();
