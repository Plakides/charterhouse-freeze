(() => {
  "use strict";

  const items = new Map();

  function register(definition) {
    if (!definition || !Number.isInteger(Number(definition.id))) {
      throw new Error("Challenge definition requires an integer id.");
    }

    const id = Number(definition.id);

    if (id < 1 || id > 8) {
      throw new Error(`Challenge id ${id} is outside the supported range 1–8.`);
    }

    items.set(id, Object.freeze({
      id,
      shortTitle: String(definition.shortTitle || `Challenge ${id}`),
      title: String(definition.title || `Challenge ${id}`),
      eyebrow: String(definition.eyebrow || "SECURITY CHALLENGE"),
      duration: String(definition.duration || "4–5 min"),
      intro: String(definition.intro || ""),
      brief: String(definition.brief || ""),
      submission: Object.freeze({
        kind: String(definition.submission?.kind || "text"),
        label: String(definition.submission?.label || "Your answer"),
        placeholder: String(definition.submission?.placeholder || "Enter your answer"),
        enabled: Boolean(definition.submission?.enabled)
      }),
      render: typeof definition.render === "function"
        ? definition.render
        : null
    }));
  }

  function get(id) {
    return items.get(Number(id)) || null;
  }

  function all() {
    return Array.from(items.values()).sort((a, b) => a.id - b.id);
  }

  window.FREEZE_CHALLENGES = Object.freeze({
    register,
    get,
    all
  });
})();
