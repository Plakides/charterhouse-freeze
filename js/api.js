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

  function delay(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function parseEnvelope(text) {
    const clean = String(text || "").trim().replace(/^\)\]\}'\s*/, "");
    if (!clean) throw new Error("Empty response");
    return JSON.parse(clean);
  }

  async function fetchAndParse(url, options, timeoutMs = 12000, retries = 1) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          redirect: "follow",
          cache: "no-store",
          signal: controller.signal
        });
        const text = await response.text();
        return parseEnvelope(text);
      } catch (error) {
        lastError = error;
        const isAbort = error && error.name === "AbortError";
        if (attempt < retries) {
          await delay(350 * (attempt + 1));
          continue;
        }
        if (isAbort) {
          throw new FreezeApiError(
            "API_TIMEOUT",
            "The emergency network is responding too slowly. Try again.",
            error
          );
        }
        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    throw lastError || new FreezeApiError("API_ERROR", "The emergency network request failed.");
  }

  async function requestPublicGet(action, params = {}) {
    const url = new URL(config.API_URL);
    url.searchParams.set("action", action);

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || typeof value === "undefined") return;
      url.searchParams.set(key, String(value));
    });

    let envelope;

    try {
      envelope = await fetchAndParse(url.toString(), { method: "GET" }, 12000, 1);
    } catch (error) {
      if (error instanceof FreezeApiError) throw error;
      throw new FreezeApiError(
        "NETWORK_ERROR",
        "The emergency network could not be reached. Check your connection and try again.",
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
    let envelope;

    try {
      envelope = await fetchAndParse(config.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({ action, payload })
      }, 14000, 1);
    } catch (error) {
      if (error instanceof FreezeApiError) throw error;
      throw new FreezeApiError(
        "INVALID_RESPONSE",
        "The emergency network returned a response the page could not read.",
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
