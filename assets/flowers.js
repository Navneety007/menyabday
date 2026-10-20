/* The flower vortex that blooms out of the gift.
   Flowers are painted once into small sprite canvases, then hundreds of
   them are drawn per frame spiralling outward like a tunnel. */
(function () {
  const PALETTE = [
    ["#d92d43", "#ff9aa2", "#7a1020"], // red
    ["#e8692a", "#ffc08f", "#8a3210"], // orange
    ["#f0c43c", "#fff2b8", "#9a7210"], // yellow
    ["#3c6ad6", "#b4cbff", "#1c2f78"], // blue
    ["#7c4fd2", "#d4c2ff", "#3a1d78"], // purple
    ["#4fbf9f", "#cdf5e6", "#1d6b55"], // mint
    ["#ee7aa3", "#ffd6e4", "#a33060"], // pink
    ["#e6e1ee", "#ffffff", "#8b8399"], // white
    ["#5aa36f", "#c9eccf", "#24603a"], // green
    ["#f08a7a", "#ffd9cf", "#a8402f"], // coral
  ];
  const rand = (a, b) => a + Math.random() * (b - a);

  function petal(g, len, wid) {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(wid * 0.9, len * 0.15, wid * 1.05, len * 0.85, 0, len);
    g.bezierCurveTo(-wid * 1.05, len * 0.85, -wid * 0.9, len * 0.15, 0, 0);
    g.closePath();
  }

  function makeSprite(colors, kind, S) {
    const pad = S * 0.12, size = S + pad * 2;
    const c = document.createElement("canvas");
    c.width = c.height = Math.ceil(size);
    const g = c.getContext("2d");
    g.translate(size / 2, size / 2);
    const [base, light, deep] = colors;
    const R = S / 2;

    // soft paper shadow under the whole flower
    g.save();
    g.shadowColor = "rgba(60,20,40,.28)";
    g.shadowBlur = S * 0.06;
    g.shadowOffsetY = S * 0.025;
    g.fillStyle = base;
    g.beginPath(); g.arc(0, 0, R * 0.55, 0, Math.PI * 2); g.fill();
    g.restore();

    const rings = kind === "rose"
      ? [[11, 1.0, 0.36], [9, 0.8, 0.38], [8, 0.6, 0.4], [6, 0.42, 0.42], [5, 0.26, 0.45]]
      : [[7, 1.0, 0.52], [7, 0.78, 0.45], [6, 0.5, 0.42]];

    rings.forEach(([n, lenK, widK], ri) => {
      const off = rand(0, Math.PI * 2);
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * Math.PI * 2 + rand(-0.12, 0.12);
        const len = R * lenK * rand(0.9, 1.04);
        const wid = len * widK;
        g.save();
        g.rotate(a);
        const gr = g.createLinearGradient(0, 0, 0, len);
        const shade = ri / rings.length;
        gr.addColorStop(0, kind === "rose" ? deep : light);
        gr.addColorStop(0.35 + shade * 0.2, base);
        gr.addColorStop(0.92, light);
        gr.addColorStop(1, "#ffffff");
        petal(g, len, wid);
        g.globalAlpha = 0.93;
        g.fillStyle = gr;
        g.fill();
        g.globalAlpha = 0.35;
        g.lineWidth = Math.max(1, S * 0.006);
        g.strokeStyle = deep;
        g.stroke();
        // watercolour highlight
        g.globalAlpha = 0.22;
        g.fillStyle = "#fff";
        g.beginPath();
        g.ellipse(-wid * 0.25, len * 0.62, wid * 0.22, len * 0.18, 0.2, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    });

    // centre
    g.globalAlpha = 1;
    if (kind === "rose") {
      const cg = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.16);
      cg.addColorStop(0, deep); cg.addColorStop(1, base);
      g.fillStyle = cg;
      g.beginPath(); g.arc(0, 0, R * 0.14, 0, Math.PI * 2); g.fill();
    } else {
      const cg = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.2);
      cg.addColorStop(0, "#2a1a20"); cg.addColorStop(0.6, deep); cg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = cg;
      g.beginPath(); g.arc(0, 0, R * 0.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#f6e08a";
      for (let i = 0; i < 18; i++) {
        const a = rand(0, Math.PI * 2), r = rand(R * 0.08, R * 0.2);
        g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, S * 0.008, 0, Math.PI * 2); g.fill();
      }
    }
    return c;
  }

  let sprites = null;
  function prepare() {
    if (sprites) return sprites;
    sprites = [];
    PALETTE.forEach((col) => {
      sprites.push(makeSprite(col, "rose", 220));
      sprites.push(makeSprite(col, Math.random() < 0.5 ? "anemone" : "rose", 220));
    });
    return sprites;
  }

  function bloom(canvas, opts) {
    opts = opts || {};
    const spr = prepare();
    const g = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const small = Math.min(W, H) < 700;
    const EMIT = 3.8;            // seconds of flowers pouring out
    const LIFE = 2.7;            // seconds for one flower to reach the edge
    const RATE = small ? 64 : 80; // flowers per second
    const N = Math.round(EMIT * RATE);
    const r0 = 5;
    const maxR = () => Math.hypot(W, H) / 2 + 120;
    const k = Math.log(maxR() / r0) / LIFE;
    const scaleK = small ? 0.5 : 0.44;

    const fl = [];
    for (let i = 0; i < N; i++) {
      fl.push({
        tb: (i / N) * EMIT + rand(-0.02, 0.02),
        th: i * 2.39996,
        s: spr[(Math.random() * spr.length) | 0],
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.6, 0.6),
        jit: rand(0.85, 1.15),
        fall: null,
      });
    }

    const t0 = performance.now();
    const FALL_AT = EMIT + 0.15;
    let fellAt = 0, peakSent = false, raf;

    function frame(now) {
      const t = (now - t0) / 1000;
      const cx = W / 2, cy = H * 0.47;
      g.clearRect(0, 0, W, H);

      if (t >= FALL_AT && !fellAt) {
        fellAt = t;
        if (!peakSent) { peakSent = true; opts.onPeak && opts.onPeak(); }
        // freeze every visible flower where it is and let gravity take it
        fl.forEach((f) => {
          const a = t - f.tb;
          if (a < 0) { f.dead = true; return; }
          const r = r0 * Math.exp(k * a);
          const size = (16 + r * scaleK) * f.jit;
          if (r - size > maxR()) { f.dead = true; return; }
          const th = f.th + 0.55 * a;
          f.fall = {
            x: cx + Math.cos(th) * r, y: cy + Math.sin(th) * r, size,
            vx: (Math.cos(th) * r) * rand(0.15, 0.6) + rand(-80, 80),
            vy: rand(-380, 40), vr: rand(-3, 3), rot: f.rot + f.spin * a,
            delay: rand(0, 0.35),
          };
        });
      }

      let alive = 0;
      for (let i = fl.length - 1; i >= 0; i--) {
        const f = fl[i];
        if (f.dead) continue;
        let x, y, size, rot, alpha = 1;
        if (!fellAt) {
          const a = t - f.tb;
          if (a < 0) { alive++; continue; }
          const r = r0 * Math.exp(k * a);
          size = (16 + r * scaleK) * f.jit;
          if (r - size > maxR()) { f.dead = true; continue; }
          const th = f.th + 0.55 * a;
          x = cx + Math.cos(th) * r; y = cy + Math.sin(th) * r;
          rot = f.rot + f.spin * a;
          const pop = Math.min(1, a / 0.35);
          size *= 1 - Math.pow(1 - pop, 3) * 0.9;
        } else {
          const p = f.fall;
          const ft = Math.max(0, t - fellAt - p.delay);
          x = p.x + p.vx * ft;
          y = p.y + p.vy * ft + 0.5 * 1500 * ft * ft;
          rot = p.rot + p.vr * ft;
          size = p.size * (1 - ft * 0.08);
          alpha = Math.max(0, 1 - Math.max(0, ft - 0.9) / 0.9);
          if (y - size > H + 50 || alpha <= 0) { f.dead = true; continue; }
        }
        alive++;
        g.globalAlpha = alpha;
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        const d = size * 1.24;
        g.drawImage(f.s, -d / 2, -d / 2, d, d);
        g.restore();
      }
      g.globalAlpha = 1;

      if (fellAt && alive === 0) {
        window.removeEventListener("resize", resize);
        g.clearRect(0, 0, W, H);
        opts.onDone && opts.onDone();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  window.Flowers = { prepare, bloom };
})();
