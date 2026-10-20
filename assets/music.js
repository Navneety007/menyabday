/* Background music.
   Plays music/song.mp3 (or whatever content.js points to). If that file
   isn't there yet, a gentle generated music-box melody plays instead. */
(function () {
  const cfg = (window.LOVE && window.LOVE.music) || {};
  const audio = new Audio();
  audio.loop = true;
  audio.preload = "auto";
  audio.playsInline = true;
  let fileState = "unknown"; // unknown | ok | missing
  audio.addEventListener("canplay", () => (fileState = "ok"), { once: true });
  audio.addEventListener("error", () => (fileState = "missing"), { once: true });
  if (cfg.src) audio.src = cfg.src; else fileState = "missing";

  let ctx = null, box = null, started = false, muted = false, using = null;
  const target = cfg.volume == null ? 0.7 : cfg.volume;

  function fadeAudio(to, ms, done) {
    const from = audio.volume, t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / ms);
      try { audio.volume = from + (to - from) * k; } catch (e) {}
      if (k < 1) requestAnimationFrame(step); else done && done();
    })(t0);
  }

  /* ---------- tiny music box synth ---------- */
  function MusicBox(ctx) {
    const master = ctx.createGain();
    master.gain.value = 0;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.33;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
    delay.connect(fb); fb.connect(delay); delay.connect(wet);
    master.connect(lp); wet.connect(lp); lp.connect(ctx.destination);
    master.connect(delay);

    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // C – G – Am – F  (and a little turn to Em on the second pass)
    const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [52, 55, 59], [53, 57, 60]];
    const melody = [76, 79, 76, 74, 74, 72, 71, 72, 72, 76, 79, 81, 79, 76, 74, 72];
    const beat = 60 / 72 / 2; // eighth notes at 72bpm
    let step = 0, next = 0, timer = null;

    function note(m, t, vol, len) {
      const f = hz(m);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      g.connect(master);
      [[1, 1], [2.01, 0.28], [3.98, 0.08]].forEach(([mul, a]) => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = "sine"; o.frequency.value = f * mul; og.gain.value = a;
        o.connect(og); og.connect(g); o.start(t); o.stop(t + len + 0.05);
      });
    }
    function schedule() {
      while (next < ctx.currentTime + 0.25) {
        const bar = Math.floor(step / 8) % chords.length, i = step % 8;
        const ch = chords[bar];
        const arp = [ch[0] - 12, ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0], ch[2] - 12];
        note(arp[i], next, 0.09, 1.6);
        if (i % 4 === 0) {
          const mi = (Math.floor(step / 4)) % melody.length;
          note(melody[mi], next + 0.01, 0.13, 2.4);
        }
        step++; next += beat;
      }
    }
    return {
      start() { next = ctx.currentTime + 0.05; schedule(); timer = setInterval(schedule, 80); this.vol(0.55, 2.5); },
      vol(v, s) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(v, ctx.currentTime, s / 3); },
    };
  }

  function startSynth() {
    if (!ctx) return;
    using = "synth";
    box = MusicBox(ctx);
    box.start();
    if (muted) box.vol(0, 0.2);
  }

  const Music = {
    /* must be called from inside a tap/click/key handler */
    unlock() {
      if (started) return;
      started = true;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
        ctx.resume();
      } catch (e) {}
      const btn = document.getElementById("musicBtn");
      if (btn) btn.hidden = false;
      if (fileState === "missing") return startSynth();
      using = "file";
      try { audio.volume = 0; } catch (e) {}
      const p = audio.play();
      if (p && p.catch) p.then(() => fadeAudio(target, 2500)).catch(startSynth);
      else fadeAudio(target, 2500);
    },
    toggle() {
      muted = !muted;
      const btn = document.getElementById("musicBtn");
      btn.classList.toggle("off", muted);
      btn.setAttribute("aria-label", muted ? "Play music" : "Pause music");
      if (using === "file") {
        if (muted) fadeAudio(0, 500, () => audio.pause());
        else { audio.play(); fadeAudio(target, 800); }
      } else if (box) {
        box.vol(muted ? 0 : 0.55, muted ? 0.4 : 1);
      }
    },
  };

  // pause when she switches apps / tabs, resume when she comes back
  document.addEventListener("visibilitychange", () => {
    if (!started || muted) return;
    if (document.hidden) { using === "file" ? audio.pause() : ctx && ctx.suspend(); }
    else { using === "file" ? audio.play() : ctx && ctx.resume(); }
  });

  window.Music = Music;
})();
