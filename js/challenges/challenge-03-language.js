(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 3,
    shortTitle: 'SECRET MESSAGE',
    title: 'Құпия хабар / Secret Message',
    eyebrow: 'LANGUAGE',
    duration: '4–5 min',
    intro: 'A multilingual message has frozen mid-transmission.',
    brief: 'Use the clues and, if useful, the Field Kit language guide to recover the message.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">03</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>Құпия хабар / Secret Message</h3>
        <p>Use the clues and, if useful, the Field Kit language guide to recover the message.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
