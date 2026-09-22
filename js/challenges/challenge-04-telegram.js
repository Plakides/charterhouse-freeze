(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 4,
    shortTitle: 'TELEGRAM',
    title: 'The Charterhouse Telegram',
    eyebrow: 'CIPHER',
    duration: '4–5 min',
    intro: 'An old Charterhouse telegram has arrived in a form nobody ordered.',
    brief: 'Decode the message. The Field Kit may contain something suspiciously relevant.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">04</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>The Charterhouse Telegram</h3>
        <p>Decode the message. The Field Kit may contain something suspiciously relevant.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
