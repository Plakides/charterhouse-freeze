(() => {
  "use strict";

  window.FREEZE_CHALLENGES.register({
    id: 1,
    shortTitle: 'LOGIC',
    title: 'House of Confusion',
    eyebrow: 'VISUAL DEDUCTION',
    duration: '4 min',
    intro: 'Someone has the missing key. The evidence is annoyingly unhelpful.',
    brief: 'Use the visual clues to work out who has the key.',
    submission: {
      kind: "text",
      label: "Security answer",
      placeholder: "Challenge answer",
      enabled: false
    },
    render(container) {
      container.innerHTML = `
        <div class="challenge-placeholder-mark" aria-hidden="true">01</div>
        <p class="challenge-placeholder-kicker">PUZZLE CONTENT SLOT</p>
        <h3>House of Confusion</h3>
        <p>Use the visual clues to work out who has the key.</p>
        <div class="challenge-placeholder-note">
          <strong>Framework ready.</strong>
          <span>The actual puzzle content will be installed in the challenge-authoring stage.</span>
        </div>
      `;
    }
  });
})();
