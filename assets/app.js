(function () {
  const C = window.LOVE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const body = document.body;
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), C);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const SVGNS = "http://www.w3.org/2000/svg";

  gsap.registerPlugin(ScrollTrigger);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  document.title = C.pageTitle || document.title;
  $$("[data-text]").forEach((n) => {
    const v = get(n.dataset.text);
    if (v != null) n.textContent = v;
  });

  const skipLock = (() => { try { return sessionStorage.getItem("skipLock") === "1"; } catch (e) { return false; } })();
  try { sessionStorage.removeItem("skipLock"); } catch (e) {}

  /* =============== background bokeh =============== */
  (function bokeh() {
    const cv = $("#bokeh"), g = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, dots = [];
    const sprite = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const x = c.getContext("2d");
      const gr = x.createRadialGradient(28, 28, 2, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,.95)");
      gr.addColorStop(0.25, "rgba(242,150,180,.95)");
      gr.addColorStop(0.75, "rgba(232,120,160,.75)");
      gr.addColorStop(1, "rgba(232,120,160,0)");
      x.fillStyle = gr; x.beginPath(); x.arc(32, 32, 32, 0, Math.PI * 2); x.fill();
      return c;
    })();
    function resize() {
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(60, Math.round((W * H) / 24000));
      while (dots.length < n) dots.push(mk(true));
      dots.length = n;
    }
    function mk(any) {
      return { x: rand(0, W), y: any ? rand(0, H) : H + 20, r: rand(2, 9), vy: rand(8, 26), ph: rand(0, 6.28), a: rand(0.25, 0.75), sw: rand(8, 30) };
    }
    resize(); addEventListener("resize", resize);
    let last = performance.now();
    (function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.y -= d.vy * dt; d.ph += dt * 0.6;
        if (d.y < -20) Object.assign(d, mk(false));
        const x = d.x + Math.sin(d.ph) * d.sw;
        g.globalAlpha = d.a;
        g.drawImage(sprite, x - d.r, d.y - d.r, d.r * 2, d.r * 2);
      }
      requestAnimationFrame(loop);
    })(last);
  })();

  /* =============== little heart bursts =============== */
  const fx = $("#fx");
  const pinks = ["#e2557f", "#f07fa3", "#d6336c", "#f4a6bd", "#c2185b"];
  function burst(x, y, n = 8, spread = 90) {
    for (let i = 0; i < n; i++) {
      const s = el("span", null, "♥");
      s.style.fontSize = rand(12, 26) + "px";
      s.style.color = pinks[(Math.random() * pinks.length) | 0];
      fx.appendChild(s);
      const a = rand(0, Math.PI * 2), d = rand(spread * 0.4, spread);
      gsap.fromTo(s, { x, y, xPercent: -50, yPercent: -50, scale: 0, rotation: rand(-30, 30) },
        { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 40, scale: rand(0.7, 1.3), duration: rand(0.9, 1.4), ease: "power3.out",
          onComplete: () => gsap.to(s, { opacity: 0, y: "-=30", duration: 0.5, onComplete: () => s.remove() }) });
    }
  }
  function floatHeart() {
    const s = el("span", null, "♥");
    s.style.fontSize = rand(14, 34) + "px";
    s.style.color = pinks[(Math.random() * pinks.length) | 0];
    fx.appendChild(s);
    const x = rand(0, innerWidth);
    gsap.fromTo(s, { x, y: innerHeight + 30, opacity: 0 },
      { y: -60, x: x + rand(-80, 80), opacity: rand(0.5, 0.9), rotation: rand(-40, 40), duration: rand(5, 8), ease: "none", onComplete: () => s.remove() });
  }

  /* =============== music button =============== */
  $("#musicBtn").addEventListener("click", (e) => { e.stopPropagation(); Music.toggle(); });
  ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, () => Music.unlock(), { once: true, capture: true }));

  /* =============== 1. LOCK =============== */
  const HEART = "M120 206 C 62 168, 16 130, 20 80 C 24 40, 66 20, 98 38 C 108 44, 115 53, 120 62 C 125 53, 132 44, 142 38 C 174 20, 216 40, 220 80 C 224 130, 178 168, 120 206 Z";
  function heartFrame(holder, src, id, bowSide) {
    const bx = bowSide < 0 ? 52 : 188, rot = bowSide < 0 ? -28 : 28;
    holder.innerHTML = `
      <svg viewBox="0 0 240 230">
        <defs>
          <clipPath id="clip${id}"><path d="${HEART}"/></clipPath>
          <linearGradient id="ph${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde7ee"/><stop offset="1" stop-color="#f4bfcf"/></linearGradient>
        </defs>
        <path d="${HEART}" fill="none" stroke="#f9c9d7" stroke-width="34" stroke-dasharray="0 15.5" stroke-linecap="round"/>
        <path d="${HEART}" fill="none" stroke="#fff" stroke-width="26" stroke-dasharray="0 15.5" stroke-linecap="round"/>
        <path d="${HEART}" fill="#fff"/>
        <g clip-path="url(#clip${id})">
          <rect width="240" height="230" fill="url(#ph${id})"/>
          <text x="120" y="118" text-anchor="middle" font-family="Caveat, cursive" font-size="22" fill="#c0577b">♥</text>
          <text x="120" y="142" text-anchor="middle" font-family="Caveat, cursive" font-size="17" fill="#c0577b">${src.split("/").pop()}</text>
          <image href="${src}" x="0" y="0" width="240" height="230" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <path d="${HEART}" fill="none" stroke="#fff" stroke-width="11"/>
        <path d="${HEART}" fill="none" stroke="#f3a3bb" stroke-width="3.6" stroke-dasharray="0 7.5" stroke-linecap="round"/>
        <g transform="translate(${bx} 34) rotate(${rot})" fill="#f6b3c7" stroke="#e17f9f" stroke-width="1.6" stroke-linejoin="round">
          <path d="M-3 4 L -14 30 L -7 27 L -4 33 Z"/><path d="M3 4 L 14 30 L 7 27 L 4 33 Z"/>
          <path d="M0 0 C -10 -16, -32 -16, -30 0 C -32 15, -11 13, 0 0Z"/><path d="M0 0 C 10 -16, 32 -16, 30 0 C 32 15, 11 13, 0 0Z"/>
          <circle r="6"/>
        </g>
      </svg>`;
    const img = holder.querySelector("image");
    img.addEventListener("error", () => img.remove());
  }

  function lockDecor() {
    const deco = $(".lock-deco");
    const shapes = ["♡", "✦", "♥", "✧", "♡", "·"];
    for (let i = 0; i < 22; i++) {
      const d = el("span", "d", shapes[i % shapes.length]);
      let x = rand(2, 96), y = rand(2, 96);
      if (x > 15 && x < 85 && y > 12 && y < 88) (Math.random() < 0.5) ? (x = x < 50 ? rand(1, 12) : rand(88, 98)) : (y = y < 50 ? rand(1, 10) : rand(90, 98));
      d.style.left = x + "%"; d.style.top = y + "%";
      d.style.fontSize = rand(10, 24) + "px";
      d.style.animationDelay = -rand(0, 4) + "s";
      deco.appendChild(d);
    }
  }

  function startLock() {
    body.className = "phase-lock";
    // one or two heart frames, depending on how many photos are set
    const pics = [C.lock.photoLeft, C.lock.photoRight].filter(Boolean);
    if (pics.length < 2) $(".hearts-pair").classList.add("single");
    heartFrame($(".hf-left"), pics[0] || "photos/you.jpg", "L", -1);
    if (pics[1]) heartFrame($(".hf-right"), pics[1], "R", 1);
    else $(".hf-right").remove();
    lockDecor();
    const code = String(C.lock.code || "1234");
    const slots = $$(".slots i"), msg = $(".lock-msg");
    let entry = "", busy = false;

    gsap.timeline()
      .from(".lock", { opacity: 0, duration: 0.8 })
      .from(".heart-frame", { scale: 0.4, opacity: 0, rotation: (i) => (i ? 25 : -25), duration: 1.2, ease: "elastic.out(1, .6)", stagger: 0.15 }, 0.2)
      .from(".lock-title", { y: 20, opacity: 0, duration: 0.9, ease: "power3.out" }, 0.5)
      .from(".slots i", { y: 16, opacity: 0, stagger: 0.07, duration: 0.6, ease: "back.out(2)" }, 0.7)
      .from(".lock-msg", { opacity: 0, duration: 0.8 }, 0.9)
      .from(".keypad button", { y: 24, opacity: 0, scale: 0.8, stagger: { each: 0.04, from: "start" }, duration: 0.6, ease: "back.out(1.8)" }, 0.8);

    function render() { slots.forEach((s, i) => s.classList.toggle("on", i < entry.length)); }
    function check() {
      if (entry === code) {
        busy = true;
        const r = $(".slots").getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 18, 160);
        gsap.to(".slots i", { scale: 1.3, yoyo: true, repeat: 1, stagger: 0.06, duration: 0.2 });
        gsap.timeline({ delay: 0.6 })
          .to(".heart-frame", { scale: 1.12, duration: 0.35, ease: "power2.out", stagger: 0.05 })
          .to(".lock-inner", { scale: 0.92, opacity: 0, filter: "blur(10px)", duration: 0.9, ease: "power3.in" })
          .to(".lock", { opacity: 0, duration: 0.6 }, "-=0.3")
          .add(startGift);
      } else {
        busy = true;
        msg.textContent = C.lock.wrong || "try again";
        const s = $(".slots");
        s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
        setTimeout(() => { entry = ""; render(); busy = false; }, 550);
      }
    }
    function press(k) {
      if (busy) return;
      if (k === "del") entry = entry.slice(0, -1);
      else if (k === "ok") { if (entry.length === code.length) check(); else { const s = $(".slots"); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake"); } return; }
      else if (entry.length < code.length) entry += k;
      render();
      if (entry.length === code.length) setTimeout(check, 260);
    }
    $$(".keypad button").forEach((b) => b.addEventListener("click", () => press(b.dataset.k)));
    addEventListener("keydown", function kd(e) {
      if (!body.classList.contains("phase-lock")) return removeEventListener("keydown", kd);
      let k = null;
      if (/^[0-9]$/.test(e.key)) k = e.key;
      else if (e.key === "Backspace") k = "del";
      else if (e.key === "Enter") k = "ok";
      if (!k) return;
      const b = $(`.keypad button[data-k="${k}"]`);
      b.classList.add("press"); setTimeout(() => b.classList.remove("press"), 120);
      press(k);
    });
  }

  /* =============== 2. GIFT =============== */
  function buildGift() {
    const svg = $("#giftSvg");
    const ink = "#c8285c", hatch = "#e4577f";
    const bodyPath = "M46 108 L176 106 L173 192 L49 194 Z";
    const lid = "M36 84 L186 82 L187 109 L35 111 Z";
    const lines = (x0, y0, x1, y1, step, ang) => {
      let d = "";
      const t = Math.tan(ang), h = y1 - y0;
      for (let x = x0 - h / t; x < x1; x += step) d += `M${x.toFixed(1)} ${y1} L${(x + h / t).toFixed(1)} ${y0} `;
      return d;
    };
    svg.innerHTML = `
      <defs>
        <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>
        <clipPath id="cBody"><path d="${bodyPath}"/></clipPath>
        <clipPath id="cLid"><path d="${lid}"/></clipPath>
      </defs>
      <g filter="url(#rough)" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g class="gbody">
          <g clip-path="url(#cBody)" stroke="${hatch}" stroke-width="1.5" opacity=".85">
            <path class="hatch" pathLength="1" d="${lines(46, 106, 176, 194, 6.5, 1.05)}"/>
            <path class="hatch" pathLength="1" d="${lines(46, 106, 176, 194, 13, 2.2)}" opacity=".5"/>
          </g>
          <path d="M101 107 L121 107 L121 193 L101 193 Z" fill="#f8f4ef" stroke="none"/>
          <path class="draw" pathLength="1" d="M103 108 L104 192 M108 108 L108.5 192 M113 108 L113 192 M118 108 L118.5 192" stroke="${hatch}" stroke-width="1.4"/>
          <path class="draw" pathLength="1" d="${bodyPath}" stroke="${ink}" stroke-width="2.6"/>
          <path class="draw" pathLength="1" d="M48 110 L174 108.5 L172 190 L50 192 Z" stroke="${ink}" stroke-width="1.2" opacity=".6"/>
          <path class="draw" pathLength="1" d="M100 107 L100 193 M122 107 L122 193" stroke="${ink}" stroke-width="2.2"/>
        </g>
        <g class="glid">
          <g clip-path="url(#cLid)" stroke="${hatch}" stroke-width="1.5" opacity=".9">
            <path class="hatch" pathLength="1" d="${lines(35, 82, 187, 111, 5.5, 1.05)}"/>
          </g>
          <path d="M99 83 L123 83 L123 110 L99 110 Z" fill="#f8f4ef" stroke="none"/>
          <path class="draw" pathLength="1" d="M102 84 L102 109 M107 84 L107 109 M112 84 L112 109 M117 84 L117 109" stroke="${hatch}" stroke-width="1.4"/>
          <path class="draw" pathLength="1" d="${lid}" stroke="${ink}" stroke-width="2.6"/>
          <path class="draw" pathLength="1" d="M98 83 L98 110 M124 83 L124 110" stroke="${ink}" stroke-width="2.2"/>
          <path class="draw" pathLength="1" d="M110 82 C 92 52, 58 48, 66 70 C 71 84, 96 84, 110 82" stroke="${ink}" stroke-width="2.6" fill="#fbe1ea"/>
          <path class="draw" pathLength="1" d="M110 82 C 128 52, 162 48, 154 70 C 149 84, 124 84, 110 82" stroke="${ink}" stroke-width="2.6" fill="#fbe1ea"/>
          <path class="draw" pathLength="1" d="M104 78 C 92 64, 78 62, 76 70 M116 78 C 128 64, 142 62, 144 70" stroke="${hatch}" stroke-width="1.5"/>
          <path class="draw" pathLength="1" d="M103 81 C 101 74, 119 74, 117 81 C 116 87, 104 87, 103 81 Z" stroke="${ink}" stroke-width="2.4" fill="#f4a6bd"/>
        </g>
      </g>`;
  }

  function startGift() {
    body.className = "phase-gift";
    buildGift();
    const strokes = $$("#giftSvg .draw"), hatches = $$("#giftSvg .hatch");
    gsap.set([...strokes, ...hatches], { strokeDasharray: 1, strokeDashoffset: 1 });
    const intro = gsap.timeline()
      .from(".gift", { opacity: 0, duration: 0.9 })
      .to(strokes, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.12 }, 0.3)
      .to(hatches, { strokeDashoffset: 0, duration: 1.6, ease: "power1.inOut", stagger: 0.2 }, 0.9)
      .to(".gift-title", { "--wp": "110%", duration: 1.8, ease: "power1.inOut" }, 1.6)
      .to(".gift-hint", { opacity: 1, duration: 0.6, onComplete: () => $(".gift-hint").classList.add("pulse") }, 3.1);

    const float = gsap.to(".gift-btn", { y: -10, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    const wiggle = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 3.5 })
      .to("#giftSvg", { rotation: -4, duration: 0.09, transformOrigin: "50% 90%" })
      .to("#giftSvg", { rotation: 4, duration: 0.09, yoyo: true, repeat: 3 })
      .to("#giftSvg", { rotation: 0, duration: 0.12 });

    // paint the flower sprites while she looks at the gift
    setTimeout(() => Flowers.prepare(), 400);

    let opened = false;
    $(".gift-btn").addEventListener("click", () => {
      if (opened) return;
      opened = true;
      Music.unlock();
      intro.progress(1); float.kill(); wiggle.kill();
      $(".gift-hint").classList.remove("pulse");
      const r = $(".gift-btn").getBoundingClientRect();
      gsap.timeline()
        .to("#giftSvg", { rotation: -6, duration: 0.07, transformOrigin: "50% 90%" })
        .to("#giftSvg", { rotation: 6, duration: 0.07, yoyo: true, repeat: 5 })
        .to("#giftSvg", { rotation: 0, scale: 1.08, duration: 0.15 })
        .to(".glid", { y: -90, x: -30, rotation: -28, opacity: 0, duration: 0.8, ease: "power3.out", transformOrigin: "50% 100%" })
        .add(() => burst(r.left + r.width / 2, r.top + r.height * 0.4, 14, 140), "<")
        .to(".flash", { opacity: 1, duration: 0.35, ease: "power2.out" }, "<0.1")
        .to([".gift-title", ".gift-hint"], { opacity: 0, y: 10, duration: 0.5 }, "<")
        .to(".gift-btn", { scale: 0.2, opacity: 0, duration: 0.6, ease: "power3.in" }, "<0.1")
        .add(startBloom, "<0.15")
        .to(".flash", { opacity: 0, duration: 1.4, ease: "power2.inOut" });
    });
  }

  /* =============== 3. BLOOM =============== */
  function startBloom() {
    Flowers.bloom($("#flowers"), {
      onPeak: () => {
        body.className = "phase-story noscroll";
        buildStory();
        gsap.timeline({ delay: 0.9 })
          .to(".intro-title", { "--wp": "110%", duration: 2.2, ease: "power1.inOut" })
          .fromTo(".intro-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, "-=0.6")
          .add(() => { body.classList.remove("noscroll"); setupScroll(); })
          .to(".scroll-hint", { opacity: 1, duration: 1 }, "+=0.4");
      },
    });
  }

  /* =============== 4. STORY =============== */
  const flourishSVG = `<svg class="flourish" viewBox="0 0 220 26" aria-hidden="true"><path pathLength="1" d="M4 14 C 30 2, 60 26, 92 13 M128 13 C 160 26, 190 2, 216 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path pathLength="1" d="M110 21 C 96 12, 100 3, 110 9 C 120 3, 124 12, 110 21 Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
  const heartSVG = `<svg class="paper-heart" viewBox="0 0 48 44" aria-hidden="true"><path pathLength="1" d="M24 40 C 10 30, 3 22, 4 13 C 5 6, 13 2, 19 6 C 21 7.5, 23 10, 24 12 C 25 10, 27 7.5, 29 6 C 35 2, 43 6, 44 13 C 45 22, 38 30, 24 40 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  function wordSpans(parent, text) {
    text.split(/(\s+)/).forEach((t) => {
      if (!t) return;
      if (/^\s+$/.test(t)) parent.appendChild(document.createTextNode(" "));
      else parent.appendChild(el("span", "w", t));
    });
  }

  function buildStory() {
    const host = $("#chapters");
    (C.story || []).forEach((b, bi) => {
      const sec = el("section", "chapter " + b.type);
      if (b.type === "polaroids") {
        if (b.title) sec.appendChild(el("h2", "chapter-title write", b.title));
        const wall = el("div", "wall");
        (b.photos || []).forEach((p, i) => {
          const wrap = el("div", "pol-wrap");
          const fig = el("figure", "polaroid");
          const r = rand(-6, 6);
          fig.dataset.r = r;
          fig.style.setProperty("--r", r.toFixed(1) + "deg");
          const tape = el("span", "tape");
          tape.style.setProperty("--tr", rand(-8, 8).toFixed(1) + "deg");
          const ph = el("div", "ph");
          ph.dataset.name = p.src;
          const img = new Image();
          img.alt = p.caption || "";
          img.loading = "lazy";
          img.decoding = "async";
          img.onerror = () => { img.remove(); ph.classList.add("empty"); };
          img.src = p.src;
          ph.appendChild(img);
          fig.append(tape, ph, el("figcaption", null, p.caption || ""));
          fig.addEventListener("click", (e) => { e.stopPropagation(); openLightbox(p, ph.classList.contains("empty")); });
          wrap.appendChild(fig);
          wall.appendChild(wrap);
        });
        sec.appendChild(wall);
      } else if (b.type === "poem") {
        const box = el("div", "poem");
        if (b.title) box.appendChild(el("h2", "chapter-title write", b.title));
        box.insertAdjacentHTML("beforeend", flourishSVG);
        const lines = el("div", "poem-lines");
        (b.lines || []).forEach((l) => lines.appendChild(l.trim() ? el("span", "line", l) : el("span", "gap")));
        box.appendChild(lines);
        if (b.author) box.appendChild(el("div", "poem-author", b.author));
        sec.appendChild(box);
      } else if (b.type === "quote") {
        const q = el("blockquote", "quote");
        q.appendChild(el("span", "qmark", "“"));
        wordSpans(q, b.text || "");
        sec.appendChild(q);
      } else if (b.type === "letter") {
        const stage = el("div", "letter-stage");
        stage.innerHTML = `<div class="envelope"><div class="env-back"></div><div class="env-flap"></div><div class="env-front"></div><div class="env-seal">♥</div></div>`;
        const paper = el("article", "paper");
        const greet = el("p", "greet"); wordSpans(greet, b.greeting || ""); paper.appendChild(greet);
        (b.paragraphs || []).forEach((t) => { const p = el("p"); wordSpans(p, t); paper.appendChild(p); });
        const sign = el("p", "sign");
        wordSpans(sign, b.signoff || "");
        const nm = el("span", "sign-name"); wordSpans(nm, b.signature || ""); sign.appendChild(nm);
        paper.appendChild(sign);
        paper.insertAdjacentHTML("beforeend", heartSVG);
        paper.appendChild(el("span", "tap-skip hand", "tap to read faster"));
        stage.appendChild(paper);
        sec.appendChild(stage);
      }
      host.appendChild(sec);
    });
  }

  /* lightbox */
  const lb = $(".lightbox");
  function openLightbox(p, empty) {
    const img = $(".lb-img");
    img.className = "lb-img" + (empty ? " ph empty" : "");
    img.dataset.name = p.src;
    img.style.backgroundImage = empty ? "" : `url("${p.src}")`;
    $(".lightbox figcaption").textContent = p.caption || "";
    lb.style.visibility = "visible";
    gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(".lb-card", { scale: 0.6, rotation: rand(-12, 12), y: 60 }, { scale: 1, rotation: rand(-2, 2), y: 0, duration: 0.8, ease: "back.out(1.5)" });
  }
  lb.addEventListener("click", (e) => {
    e.stopPropagation();
    gsap.to(".lb-card", { scale: 0.8, y: 40, duration: 0.35, ease: "power2.in" });
    gsap.to(lb, { opacity: 0, duration: 0.35, onComplete: () => (lb.style.visibility = "hidden") });
  });

  /* =============== scroll magic =============== */
  function setupScroll() {
    const touch = matchMedia("(hover: none)").matches;
    if (!touch && window.Lenis) {
      const lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      window._lenis = lenis;
    }

    // heart thread progress
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (s) => {
        gsap.set(".thread-fill", { scaleY: s.progress });
        gsap.set(".thread-heart", { top: s.progress * 100 + "%" });
      },
    });

    // intro drifts away as she scrolls
    gsap.to(".intro > *:not(.scroll-hint)", { y: -120, opacity: 0, ease: "none", scrollTrigger: { trigger: ".intro", start: "top top", end: "bottom 20%", scrub: true } });
    gsap.to(".scroll-hint", { opacity: 0, scrollTrigger: { trigger: ".intro", start: "top+=40 top", end: "top+=200 top", scrub: true } });

    // chapter titles write themselves
    $$(".chapter-title.write").forEach((t) =>
      gsap.to(t, { "--wp": "110%", duration: 1.8, ease: "power1.inOut", scrollTrigger: { trigger: t, start: "top 82%", once: true } }));

    // polaroids get tossed onto the wall
    $$(".polaroid").forEach((p) => gsap.set(p, { opacity: 0, rotation: +p.dataset.r }));
    ScrollTrigger.batch(".polaroid", {
      start: "top 92%", once: true,
      onEnter: (batch) => batch.forEach((p, i) => {
        gsap.fromTo(p,
          { opacity: 0, y: rand(140, 220), x: rand(-160, 160), rotation: rand(-40, 40), scale: 0.55 },
          { opacity: 1, y: 0, x: 0, rotation: +p.dataset.r, scale: 1, duration: 1.4, delay: i * 0.13, ease: "back.out(1.3)" });
      }),
    });
    $$(".wall").forEach((wall) => {
      $$(".pol-wrap", wall).forEach((w, i) => {
        const s = [0.6, -0.4, 1, -0.8, 0.3][i % 5];
        gsap.fromTo(w, { y: 50 * s }, { y: -50 * s, ease: "none", scrollTrigger: { trigger: wall, start: "top bottom", end: "bottom top", scrub: 1 } });
      });
    });

    // poems: lines drift in from a soft blur
    $$(".poem").forEach((p) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: "top 72%", once: true } });
      tl.fromTo($(".flourish path", p), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.3, ease: "power2.inOut" }, 0.8)
        .fromTo($$(".line", p), { opacity: 0, y: 26, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, stagger: 0.38, ease: "power3.out" }, 1.1)
        .fromTo($$(".poem-author", p), { opacity: 0 }, { opacity: 1, duration: 1.2 }, "-=0.6");
      gsap.set([...$$(".line", p), ...$$(".poem-author", p)], { opacity: 0 });
    });

    // quote: words light up as she scrolls through
    $$(".quote").forEach((q) => {
      gsap.to($$(".w", q), { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: q, start: "top 78%", end: "bottom 55%", scrub: 0.6 } });
    });

    // the letter
    $$(".letter-stage").forEach((st) => {
      const paper = $(".paper", st), words = $$(".w", paper);
      gsap.set(paper, { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 });
      gsap.set(".tap-skip", { opacity: 0 });
      gsap.set($(".paper-heart path", st), { strokeDasharray: 1, strokeDashoffset: 1 });
      const tl = gsap.timeline({ paused: true })
        .from($(".envelope", st), { y: 80, scale: 0.7, opacity: 0, rotation: -6, duration: 1.1, ease: "back.out(1.6)" })
        .to($(".env-seal", st), { scale: 0, rotation: 90, opacity: 0, duration: 0.4, ease: "back.in(2)" }, "+=0.3")
        .to($(".env-flap", st), { rotationX: 180, duration: 0.8, ease: "power2.inOut" })
        .set($(".env-flap", st), { zIndex: 0 })
        .to($(".envelope", st), { y: 160, opacity: 0, scale: 0.9, duration: 1, ease: "power2.in" }, "+=0.15")
        .to(paper, { opacity: 1, duration: 0.3 }, "<0.2")
        .fromTo(paper, { y: 70 }, { y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power3.out" }, "<")
        .to($(".tap-skip", st), { opacity: 1, duration: 0.6 }, "-=0.5")
        .to(words, { opacity: 1, duration: 0.35, stagger: 0.055, ease: "power1.out" })
        .to($(".tap-skip", st), { opacity: 0, duration: 0.4 })
        .to($(".paper-heart path", st), { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, "<");
      ScrollTrigger.create({ trigger: st, start: "top 70%", once: true, onEnter: () => tl.play() });
      paper.addEventListener("click", (e) => {
        e.stopPropagation();
        if (tl.progress() > 0.25 && tl.progress() < 1) gsap.to(tl, { progress: 1, duration: 1.2, ease: "power1.in" });
      });
    });

    // finale
    let heartsTimer = null;
    gsap.timeline({ scrollTrigger: { trigger: ".finale", start: "top 55%", once: true } })
      .to(".finale-title", { "--wp": "110%", duration: 2.6, ease: "power1.inOut" })
      .add(() => { for (let i = 0; i < 3; i++) setTimeout(() => burst(innerWidth / 2 + rand(-160, 160), innerHeight / 2 + rand(-60, 60), 12, 170), i * 220); }, "-=0.6")
      .fromTo(".finale-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.3 }, "-=0.2")
      .fromTo(".replay", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1 }, "+=0.6");
    ScrollTrigger.create({
      trigger: ".finale", start: "top 60%", end: "bottom top",
      onToggle: (s) => {
        clearInterval(heartsTimer);
        if (s.isActive) heartsTimer = setInterval(floatHeart, 420);
      },
    });
    $(".replay").addEventListener("click", (e) => {
      e.stopPropagation();
      try { sessionStorage.setItem("skipLock", "1"); } catch (err) {}
      gsap.to("body", { opacity: 0, duration: 0.8, onComplete: () => { window.scrollTo(0, 0); location.reload(); } });
    });

    ScrollTrigger.refresh();
  }

  // tap anywhere in the story for little hearts
  addEventListener("pointerdown", (e) => {
    if (!body.classList.contains("phase-story")) return;
    if (e.target.closest("button, .lightbox")) return;
    burst(e.clientX, e.clientY, 6, 60);
  });
  addEventListener("resize", () => ScrollTrigger.refresh());

  /* =============== go =============== */
  const fontsReady = document.fonts
    ? Promise.race([
        Promise.all(['500 40px "Dancing Script"', "400 20px Caveat", 'italic 400 20px "Cormorant Garamond"', '400 20px "Cormorant Garamond"'].map((f) => document.fonts.load(f))),
        new Promise((r) => setTimeout(r, 3000)),
      ]).catch(() => {})
    : Promise.resolve();
  // ?preview=lock | gift | story | finale  (and &block=N) jumps straight to one screen, used by the editor
  const params = new URLSearchParams(location.search);
  const preview = params.get("preview");
  function jumpToStory(target) {
    body.className = "phase-story";
    buildStory();
    gsap.set(".intro-title", { "--wp": "110%" });
    gsap.set([".intro-sub", ".scroll-hint"], { opacity: 1 });
    setupScroll();
    const el = target === "finale" ? $(".finale") : target != null ? $$("#chapters > section")[+target] : null;
    if (el) requestAnimationFrame(() => {
      const y = el.getBoundingClientRect().top + scrollY - 40;
      window._lenis ? window._lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
    });
  }
  fontsReady.then(() => {
    if (preview === "lock") startLock();
    else if (preview === "gift") startGift();
    else if (preview === "story") jumpToStory(params.get("block"));
    else if (preview === "finale") jumpToStory("finale");
    else if (C.lock && C.lock.enabled && !skipLock) startLock();
    else startGift();
  });
})();
