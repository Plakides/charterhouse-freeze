(() => {
  "use strict";
  const BUILD = "8I1";
  const RELOAD_KEY = `charterhouseFreeze.swReload.${BUILD}`;
  const hadControllerAtLoad = Boolean(navigator.serviceWorker?.controller);
  const card = document.getElementById("offlineReadiness");
  const title = document.getElementById("offlineReadinessTitle");
  const detail = document.getElementById("offlineReadinessDetail");
  function setState(state, heading, copy) {
    if (!card) return;
    card.classList.remove("is-checking","is-ready","is-updating","is-error");
    card.classList.add(`is-${state}`);
    if (title) title.textContent = heading;
    if (detail) detail.textContent = copy;
  }
  function ask(worker, message, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (!worker) return reject(new Error("No active service worker."));
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(new Error("Offline readiness check timed out.")), timeoutMs);
      channel.port1.onmessage = event => { clearTimeout(timer); resolve(event.data); };
      worker.postMessage(message, [channel.port2]);
    });
  }
  async function check(registration) {
    const worker = navigator.serviceWorker.controller || registration?.active || registration?.waiting;
    const result = await ask(worker, { type: "CHECK_OFFLINE_READY", build: BUILD });
    if (result?.ready && result?.build === BUILD) {
      setState("ready", "GAME READY FOR OFFLINE USE ✓", "This browser has the complete game saved.");
      return true;
    }
    setState("updating", "UPDATING OFFLINE COPY…", "Keep this page open until the offline check completes.");
    return false;
  }
  async function register() {
    if (!("serviceWorker" in navigator)) {
      setState("error", "OFFLINE MODE UNAVAILABLE", "This browser does not support the required offline cache.");
      return;
    }
    setState("checking", "PREPARING OFFLINE COPY…", "Saving the complete game to this browser.");
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js", { scope: "./", updateViaCache: "none" });
      registration.update().catch(() => {});
      if (registration.installing) setState("updating", "SAVING OFFLINE COPY…", "Keep this page open until this finishes.");
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        setState("updating", "UPDATING OFFLINE COPY…", "A newer game build is being saved.");
        installing.addEventListener("statechange", () => {
          if (installing.state === "activated") check(registration).catch(() => {});
          if (installing.state === "redundant") setState("error", "OFFLINE COPY INCOMPLETE", "Stay online and reload this page once.");
        });
      });
      const ready = await navigator.serviceWorker.ready;
      await check(ready);
    } catch (error) {
      console.warn("Offline cache setup failed:", error);
      setState("error", "OFFLINE COPY NOT READY", "Stay online and reload once before the session.");
    }
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadControllerAtLoad) { navigator.serviceWorker.ready.then(check).catch(() => {}); return; }
      if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      location.reload();
    });
  }
  register();
  window.FREEZE_OFFLINE = Object.freeze({ build: BUILD, check: async () => check(await navigator.serviceWorker.ready) });
})();
