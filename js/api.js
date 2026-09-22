(() => {
  "use strict";

  const config = window.FREEZE_CONFIG;

  if (!config || !config.API_URL) {
    throw new Error("FREEZE_CONFIG.API_URL is missing.");
  }

  class FreezeApiError extends Error {
    constructor(code, message, details = null) {
      super(message || "The backend returned an error.");
      this.name = "FreezeApiError";
      this.code = code || "API_ERROR";
      this.details = details;
    }
  }

  async function requestPublicGet(action, params = {}) {
    const url = new URL(config.API_URL);
    url.searchParams.set("action", action);

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || typeof value === "undefined") return;
      url.searchParams.set(key, String(value));
    });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    let response;

    try {
      response = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal
      });
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new FreezeApiError(
          "API_TIMEOUT",
          "The scoreboard is taking too long to respond. Try again.",
          error
        );
      }

      throw new FreezeApiError(
        "NETWORK_ERROR",
        "The emergency network could not be reached. Check your connection and try again.",
        error
      );
    } finally {
      window.clearTimeout(timeoutId);
    }

    let envelope;

    try {
      envelope = await response.json();
    } catch (error) {
      throw new FreezeApiError(
        "INVALID_RESPONSE",
        "The emergency network returned an unreadable response.",
        error
      );
    }

    if (!envelope || envelope.ok !== true) {
      const backendError = envelope && envelope.error ? envelope.error : {};
      throw new FreezeApiError(
        backendError.code || "API_ERROR",
        backendError.message || "The emergency network rejected the request.",
        envelope
      );
    }

    return envelope.data;
  }

  async function request(action, payload = {}) {
    let response;

    try {
      response = await fetch(config.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action,
          payload
        }),
        redirect: "follow",
        cache: "no-store"
      });
    } catch (error) {
      throw new FreezeApiError(
        "NETWORK_ERROR",
        "The emergency network could not be reached. Check your connection and try again.",
        error
      );
    }

    let envelope;

    try {
      envelope = await response.json();
    } catch (error) {
      throw new FreezeApiError(
        "INVALID_RESPONSE",
        "The emergency network returned an unreadable response.",
        error
      );
    }

    if (!envelope || envelope.ok !== true) {
      const backendError = envelope && envelope.error ? envelope.error : {};
      throw new FreezeApiError(
        backendError.code || "API_ERROR",
        backendError.message || "The emergency network rejected the request.",
        envelope
      );
    }

    return envelope.data;
  }

  window.FREEZE_API = Object.freeze({
    request,
    registerTeam(payload) {
      return request("registerTeam", payload);
    },
    startMission(payload) {
      return request("startMission", payload);
    },
    getTeamState(payload) {
      return request("getTeamState", payload);
    },
    submitAnswer(payload) {
      return request("submitAnswer", payload);
    },
    getLeaderboard(payload = {}) {
      return requestPublicGet("getLeaderboard", payload);
    },
    submitFinalCode(payload) {
      return request("submitFinalCode", payload);
    }
  });

  window.FreezeApiError = FreezeApiError;
})();
