(() => {
  "use strict";

  /*
   * Offline answer engine
   * ---------------------
   * This is deliberately an obfuscation layer, not a security boundary.
   * Any answer checked entirely in a browser can ultimately be reverse-engineered
   * by a determined user. Its purpose is to avoid keeping an obvious plaintext
   * answer table in the code while giving every puzzle one consistent validator.
   */

  const definitions = Object.freeze({
    1: Object.freeze({
      mode: "text",
      pepper: "CF8C1-C01-logic-Q7N2-9K4M",
      hashes: Object.freeze([
        "0e363e9e9e028e6a3ea4af49b2f6a1c47440dee4c28805e7b66ebd50637fbe7a"
      ])
    }),
    2: Object.freeze({
      mode: "text",
      pepper: "CF9BD-C02-map-M8-K2P7",
      hashes: Object.freeze([
        "8e77f4424de05ffa757bf007c0dab4f233fa456816f4da666c4d866a2ac3a9f9"
      ])
    }),
    3: Object.freeze({
      mode: "text",
      pepper: "CF9CC-C03-language-B2-T6",
      hashes: Object.freeze([
        "437babb8e3bc64c770f7b723b423ddb16366b5e84643a32407d3747f1f9d3b9f",
        "eb93863da84b2344dbc73855feaa02fec72b8eed11da99e5dc999c828da72243"
      ])
    }),
    4: Object.freeze({
      mode: "text",
      pepper: "CF9DC-C04-caesar-T7-W8",
      hashes: Object.freeze([
        "e71e37ae183bd327bafdc6ac015535f88e9b759b67261207d041e47a82a34de5"
      ])
    }),
    5: Object.freeze({
      mode: "text",
      pepper: "CF9EC-C05-timetable-E5-M3",
      hashes: Object.freeze([
        "07536f005dcbe8db072146e8405b8c1df997d853af94ec3d91ba537127763d0c"
      ])
    })
  });

  function normaliseText(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("en-GB");
  }

  function normaliseCompact(value) {
    return normaliseText(value)
      .replace(/[\s\-_./\\]+/g, "")
      .replace(/[^\p{L}\p{N}]/gu, "");
  }

  function normaliseDigits(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .replace(/\D+/g, "");
  }

  function normalise(value, mode = "text") {
    switch (mode) {
      case "compact":
        return normaliseCompact(value);
      case "digits":
        return normaliseDigits(value);
      case "text":
      default:
        return normaliseText(value);
    }
  }

  function bytesToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(value => value.toString(16).padStart(2, "0"))
      .join("");
  }

  async function sha256Hex(value) {
    if (
      !window.crypto ||
      !window.crypto.subtle ||
      typeof window.crypto.subtle.digest !== "function"
    ) {
      throw new Error(
        "This browser does not support the local answer-checking engine."
      );
    }

    const data = new TextEncoder().encode(String(value));
    const digestBuffer = await window.crypto.subtle.digest("SHA-256", data);
    return bytesToHex(digestBuffer);
  }

  function timingSafeEqual(left, right) {
    const a = String(left || "");
    const b = String(right || "");

    if (a.length !== b.length) return false;

    let difference = 0;
    for (let index = 0; index < a.length; index += 1) {
      difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
    }

    return difference === 0;
  }

  async function fingerprint(definition, rawAnswer) {
    const normalised = normalise(rawAnswer, definition.mode);
    const payload = `${definition.pepper}\x1f${normalised}`;
    return sha256Hex(payload);
  }

  async function validate(challengeId, rawAnswer) {
    const id = Number(challengeId);
    const definition = definitions[id];

    if (!definition) {
      return Object.freeze({
        known: false,
        correct: false,
        challengeId: id,
        mode: null
      });
    }

    const answerHash = await fingerprint(definition, rawAnswer);
    const correct = definition.hashes.some(hash =>
      timingSafeEqual(hash, answerHash)
    );

    return Object.freeze({
      known: true,
      correct,
      challengeId: id,
      mode: definition.mode
    });
  }

  function hasDefinition(challengeId) {
    return Boolean(definitions[Number(challengeId)]);
  }

  function registeredChallenges() {
    return Object.keys(definitions)
      .map(Number)
      .sort((a, b) => a - b);
  }

  async function selfTest() {
    // Public test vector only; this is NOT a puzzle answer.
    const value = await sha256Hex("Charterhouse Freeze");
    return value ===
      "87feb3e3d0a0804fecde5dcc4cc7d31310339e56ccade2497541977c70074e2e";
  }

  window.FREEZE_ANSWER_ENGINE = Object.freeze({
    normalise,
    validate,
    hasDefinition,
    registeredChallenges,
    selfTest
  });
})();
