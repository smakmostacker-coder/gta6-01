// Tiny WebAudio synth: every sound is an oscillator or noise burst, no audio files needed.
export function createAudio() {
  let ctx = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null;
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'square', vol = 0.12, slide = 0) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, vol = 0.15) {
    const c = ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(g).connect(c.destination); src.start();
  }
  return {
    unlock() { ensure(); },
    pickup() { tone(880, 0.09, 'square', 0.1); setTimeout(() => tone(1320, 0.12, 'square', 0.1), 60); },
    cash() { tone(660, 0.08, 'triangle', 0.14); setTimeout(() => tone(990, 0.14, 'triangle', 0.14), 70); },
    punch() { noise(0.08, 0.2); tone(120, 0.08, 'sine', 0.2, -60); },
    shot() { noise(0.12, 0.25); tone(220, 0.1, 'sawtooth', 0.12, -160); },
    hit() { tone(180, 0.07, 'square', 0.1, -80); },
    enterCar() { tone(300, 0.1, 'sine', 0.12, 120); },
    crash() { noise(0.25, 0.3); tone(90, 0.25, 'sine', 0.25, -40); },
    mission() { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.13), i * 110)); },
    choice() { tone(520, 0.07, 'triangle', 0.12); setTimeout(() => tone(390, 0.09, 'triangle', 0.1), 55); },
    jobDone() { [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.13, 'square', 0.09), i * 80)); },
    ending() { [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.11), i * 170)); },
    busted() { tone(400, 0.5, 'sawtooth', 0.12, -250); },
    setEngine(on, speed = 0) {
      const c = ensure(); if (!c) return;
      if (on && !engineOsc) {
        engineOsc = c.createOscillator(); engineGain = c.createGain();
        engineOsc.type = 'sawtooth'; engineGain.gain.value = 0.03;
        engineOsc.connect(engineGain).connect(c.destination); engineOsc.start();
      }
      if (engineOsc) { engineOsc.frequency.value = 55 + Math.abs(speed) * 0.55; engineGain.gain.value = on ? 0.035 : 0; if (!on) { engineOsc.stop(); engineOsc = null; } }
    },
    setSiren(on) {
      const c = ensure(); if (!c) return;
      if (on && !sirenOsc) {
        sirenOsc = c.createOscillator(); sirenGain = c.createGain();
        sirenOsc.type = 'triangle'; sirenGain.gain.value = 0.018;
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 1.4; lg.gain.value = 140; lfo.connect(lg).connect(sirenOsc.frequency);
        sirenOsc.frequency.value = 760; sirenOsc.connect(sirenGain).connect(c.destination);
        sirenOsc.start(); lfo.start(); sirenOsc._lfo = lfo;
      }
      if (!on && sirenOsc) { try { sirenOsc.stop(); sirenOsc._lfo.stop(); } catch {} sirenOsc = null; }
    },
  };
}
