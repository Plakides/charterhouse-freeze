(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 2,
    shortTitle: 'LOST IN ALMATY',
    title: 'Lost in Almaty',
    eyebrow: 'MAP & DIRECTIONS',
    duration: '4–5 min',
    intro: 'Emergency control has misplaced something somewhere in Almaty. Naturally.',
    brief: 'Follow the map information and directions to identify the correct location.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">02</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>Lost in Almaty</h3>
        <p>Follow the map information and directions to identify the correct location.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
