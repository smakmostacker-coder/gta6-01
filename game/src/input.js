// Keyboard and mouse state: held movement keys, one-shot action flags, and the aim position.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false };
  window.addEventListener('keydown', (e) => {
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); mouse.down = false; });
  canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  canvas.addEventListener('pointerdown', (e) => { mouse.down = true; mouse.clicked = true; const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  window.addEventListener('pointerup', () => { mouse.down = false; });
  return {
    keys, mouse,
    down: (...codes) => codes.some((c) => keys.has(c)),
    wasPressed: (code) => pressed.has(code),
    endFrame() { pressed.clear(); mouse.clicked = false; },
    moveVector() {
      let x = 0, y = 0;
      if (this.down('KeyA','ArrowLeft')) x -= 1;
      if (this.down('KeyD','ArrowRight')) x += 1;
      if (this.down('KeyW','ArrowUp')) y -= 1;
      if (this.down('KeyS','ArrowDown')) y += 1;
      const m = Math.hypot(x, y) || 1;
      return { x: x / m, y: y / m, active: x !== 0 || y !== 0 };
    },
  };
}
