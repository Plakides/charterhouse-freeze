(() => {
  "use strict";

  const TOOL_IDS = [
    "caesar",
    "calculator",
    "binary",
    "morse",
    "language",
    "compass",
    "banana"
  ];

  let overlay = null;
  let lastFocused = null;
  let activeTool = "caesar";

  function normaliseShift(value) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return 0;
    return ((n % 26) + 26) % 26;
  }

  function caesarDecode(text, shift) {
    const amount = normaliseShift(shift);

    return String(text || "").replace(/[A-Za-z]/g, char => {
      const code = char.charCodeAt(0);
      const base = code >= 97 ? 97 : 65;
      return String.fromCharCode(((code - base - amount + 26) % 26) + base);
    });
  }

  function updateCaesar() {
    const input = document.getElementById("caesarInput");
    const shift = document.getElementById("caesarShift");
    const output = document.getElementById("caesarOutput");

    if (!input || !shift || !output) return;

    const amount = normaliseShift(shift.value);
    shift.value = String(amount);

    output.textContent = input.value
      ? caesarDecode(input.value, amount)
      : "Decoded text will appear here.";
  }

  function calculate() {
    const a = Number(document.getElementById("calcA")?.value);
    const b = Number(document.getElementById("calcB")?.value);
    const op = document.getElementById("calcOperator")?.value;
    const output = document.getElementById("calcResult");

    if (!output) return;

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      output.textContent = "Enter two numbers.";
      return;
    }

    let result;

    switch (op) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "*": result = a * b; break;
      case "/":
        if (b === 0) {
          output.textContent = "Cannot divide by zero.";
          return;
        }
        result = a / b;
        break;
      default:
        output.textContent = "Choose an operation.";
        return;
    }

    output.textContent = Number.isInteger(result)
      ? String(result)
      : String(Math.round(result * 1000000) / 1000000);
  }

  function convertDecimal() {
    const input = document.getElementById("decimalInput");
    const output = document.getElementById("decimalBinaryOutput");
    if (!input || !output) return;

    const value = Number.parseInt(input.value, 10);

    if (!Number.isInteger(value) || value < 0 || value > 255) {
      output.textContent = "Enter a whole number from 0 to 255.";
      return;
    }

    output.textContent = value.toString(2).padStart(8, "0");
  }

  function convertBinary() {
    const input = document.getElementById("binaryInput");
    const output = document.getElementById("binaryDecimalOutput");
    if (!input || !output) return;

    const value = String(input.value || "").replace(/\s+/g, "");

    if (!/^[01]{1,8}$/.test(value)) {
      output.textContent = "Enter 1–8 binary digits.";
      return;
    }

    output.textContent = String(Number.parseInt(value, 2));
  }

  function selectTool(toolId) {
    if (!TOOL_IDS.includes(toolId)) return;

    activeTool = toolId;

    document.querySelectorAll("[data-field-tool]").forEach(button => {
      const active = button.dataset.fieldTool === toolId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    document.querySelectorAll("[data-field-panel]").forEach(panel => {
      const active = panel.dataset.fieldPanel === toolId;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }

  function open(options = {}) {
    if (!overlay) return;

    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    selectTool(options.tool || activeTool || "caesar");

    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      const close = overlay.querySelector(".modal-close");
      if (close) close.focus();
    });
  }

  function close() {
    if (!overlay || overlay.hidden) return;

    overlay.classList.remove("is-open");

    window.setTimeout(() => {
      overlay.hidden = true;
      document.body.classList.remove("modal-open");

      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }, 180);
  }

  function handleKeydown(event) {
    if (!overlay || overlay.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      overlay.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => !element.hidden && element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initialise() {
    overlay = document.getElementById("fieldKitOverlay");
    if (!overlay) return;

    overlay.querySelectorAll("[data-field-tool]").forEach(button => {
      button.addEventListener("click", () => selectTool(button.dataset.fieldTool));
    });

    overlay.querySelectorAll("[data-close-modal]").forEach(button => {
      button.addEventListener("click", close);
    });

    overlay.addEventListener("mousedown", event => {
      if (event.target === overlay) close();
    });

    document.addEventListener("keydown", handleKeydown);

    document.getElementById("caesarInput")?.addEventListener("input", updateCaesar);
    document.getElementById("caesarShift")?.addEventListener("input", updateCaesar);
    document.getElementById("caesarMinus")?.addEventListener("click", () => {
      const field = document.getElementById("caesarShift");
      field.value = String(normaliseShift(Number(field.value) - 1));
      updateCaesar();
    });
    document.getElementById("caesarPlus")?.addEventListener("click", () => {
      const field = document.getElementById("caesarShift");
      field.value = String(normaliseShift(Number(field.value) + 1));
      updateCaesar();
    });

    document.getElementById("calcButton")?.addEventListener("click", calculate);
    document.getElementById("convertDecimalButton")?.addEventListener("click", convertDecimal);
    document.getElementById("convertBinaryButton")?.addEventListener("click", convertBinary);

    document.getElementById("bananaButton")?.addEventListener("click", () => {
      const result = document.getElementById("bananaResult");
      const button = document.getElementById("bananaButton");

      button.disabled = true;
      result.textContent = "Deploying banana…";

      window.setTimeout(() => {
        result.innerHTML = "<strong>Banana successfully deployed.</strong><br>Situation unchanged.<br><small>Strategic impact: negligible.</small>";
        button.textContent = "BANANA DEPLOYED";
      }, 650);
    });

    selectTool("caesar");
    updateCaesar();
  }

  window.FREEZE_FIELD_KIT = Object.freeze({
    initialise,
    open,
    close,
    selectTool,
    caesarDecode
  });
})();
