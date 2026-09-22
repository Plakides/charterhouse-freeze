(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 8,
    shortTitle: 'MEMORY',
    title: 'The Snow Leopard’s Memory Test',
    eyebrow: 'OBSERVATION',
    duration: '3–4 min',
    intro: 'The snow leopard insists this is a perfectly normal security procedure.',
    brief: 'Study the image carefully, then answer the memory questions without reopening it.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">08</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>The Snow Leopard’s Memory Test</h3>
        <p>Study the image carefully, then answer the memory questions without reopening it.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
