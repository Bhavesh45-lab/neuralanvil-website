/* Constellation layer for dark sections.
   Sparse electric-blue stars with the occasional champagne-gold node, joined
   into small constellations by hairline links, kept at low opacity so text stays
   readable. Light (white) sections never get it.
   Also exposed as window.NAConstellation for the hero canvas in forge.js. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BLUE = [120, 185, 255], GOLD = [232, 201, 140];

  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // Build a field: loose dust stars plus a handful of constellations.
  // Each constellation is a chain where every new star links to its nearest earlier star,
  // which gives the irregular, hand-drawn shape of a real star chart (not a grid).
  function build(W, H, o = {}) {
    const r = rng(o.seed || Math.round(W * 7 + H * 13));
    const area = W * H;
    const dust = [], stars = [], links = [];
    const nDust = Math.round(area / (o.dustDensity || 5200));
    for (let i = 0; i < nDust; i++) dust.push({ x: r() * W, y: r() * H, s: .4 + r() * .9, a: .15 + r() * .5, t: r() * 6.28 });

    const nCon = Math.max(3, Math.round(area / (o.conDensity || 150000)));
    const avoid = o.avoid || null; // {x,y,w,h} area to keep quiet (text block)
    for (let c = 0; c < nCon; c++) {
      let cx, cy, tries = 0;
      do { cx = r() * W; cy = r() * H; tries++; }
      while (avoid && tries < 12 && cx > avoid.x && cx < avoid.x + avoid.w && cy > avoid.y && cy < avoid.y + avoid.h);
      const n = 4 + Math.floor(r() * 4), spread = 70 + r() * 110, start = stars.length;
      for (let k = 0; k < n; k++) {
        const ang = r() * 6.283, d = spread * (0.35 + r() * .9);
        const x = k ? stars[start + Math.floor(r() * k)].x + Math.cos(ang) * d * .7 : cx;
        const y = k ? stars[start + Math.floor(r() * k)].y + Math.sin(ang) * d * .55 : cy;
        const gold = r() < (o.gold ?? .09);
        stars.push({ x, y, s: gold ? 1.7 + r() * .9 : 1 + r() * 1.2, gold, a: .55 + r() * .45, t: r() * 6.28 });
        if (k) {
          let best = start, bd = 1e9;
          for (let j = start; j < start + k; j++) { const d2 = (stars[j].x - x) ** 2 + (stars[j].y - y) ** 2; if (d2 < bd) { bd = d2; best = j; } }
          links.push([best, start + k]);
        }
      }
      // one closing link in some constellations for a more figurative shape
      if (n > 4 && r() < .4) links.push([start, start + n - 1]);
    }
    // Neuron hubs: a few brighter stars with 3-5 links to nearby stars in other groups,
    // so the sky reads as one loose neural network rather than separate star charts
    const nHub = Math.max(2, Math.round(stars.length / 14));
    const reachMax = o.hubReach || Math.min(320, Math.max(W, H) * .22);
    const has = new Set(links.map(([a, b]) => a < b ? a + "-" + b : b + "-" + a));
    for (let h = 0; h < nHub; h++) {
      const hi = Math.floor(r() * stars.length), hub = stars[hi];
      hub.hub = true; hub.s *= 1.35; hub.a = Math.min(1, hub.a + .2);
      const near = stars.map((s, j) => [j, Math.hypot(s.x - hub.x, s.y - hub.y)])
        .filter(([j, d]) => j !== hi && d > 40 && d < reachMax).sort((a, b) => a[1] - b[1]);
      const want = 3 + Math.floor(r() * 3);
      for (const [j] of near.slice(0, want)) {
        const key = hi < j ? hi + "-" + j : j + "-" + hi;
        if (!has.has(key)) { has.add(key); links.push([hi, j]); }
      }
    }
    // signal timing per link: each link fires a small pulse every 7-16 s
    const sig = links.map(() => ({ ph: r(), per: 7 + r() * 9 }));
    return { W, H, dust, stars, links, sig };
  }

  function draw(ctx, g, t, o = {}) {
    const k = o.opacity ?? 1, fade = o.fade || null; // fade(x,y) -> 0..1 multiplier
    const tw = s => reduce ? 1 : .7 + .3 * Math.sin(t * .0009 + s.t);
    for (const d of g.dust) {
      const f = fade ? fade(d.x, d.y) : 1; if (f <= 0) continue;
      ctx.fillStyle = `rgba(${BLUE},${d.a * tw(d) * k * f * .8})`;
      ctx.fillRect(d.x, d.y, d.s, d.s);
    }
    ctx.lineWidth = .6;
    for (const [i, j] of g.links) {
      const a = g.stars[i], b = g.stars[j], f = fade ? fade((a.x + b.x) / 2, (a.y + b.y) / 2) : 1; if (f <= 0) continue;
      ctx.strokeStyle = `rgba(${BLUE},${.2 * k * f})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    // signal pulses travelling along links, like spikes between neurons
    if (!reduce && g.sig) {
      const sec = t / 1000;
      g.links.forEach(([i, j], n) => {
        const q = g.sig[n], p = (sec / q.per + q.ph) % 1, travel = 1.4 / q.per;
        if (p > travel) return;
        const e = p / travel, a = g.stars[i], b = g.stars[j];
        const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e;
        const f = fade ? fade(x, y) : 1; if (f <= 0) return;
        const al = Math.sin(Math.PI * e) * .75 * k * f;
        const pg = ctx.createRadialGradient(x, y, 0, x, y, 6);
        pg.addColorStop(0, `rgba(200,230,255,${al})`); pg.addColorStop(1, "rgba(120,185,255,0)");
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.283); ctx.fill();
      });
    }
    for (const s of g.stars) {
      const f = fade ? fade(s.x, s.y) : 1; if (f <= 0) continue;
      const c = s.gold ? GOLD : BLUE, a = s.a * tw(s) * k * f;
      const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.s * 5);
      halo.addColorStop(0, `rgba(${c},${a * (s.gold ? .6 : .45)})`); halo.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(s.x, s.y, s.s * 5, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(${s.gold ? "255,236,200" : "215,235,255"},${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s * .85, 0, 6.283); ctx.fill();
    }
  }

  window.NAConstellation = { build, draw };

  // ---------- attach to every dark section (not the hero, which forge.js draws) ----------
  const targets = document.querySelectorAll(".tone-dark, .page-hero, .site-footer");
  targets.forEach((sec, idx) => {
    if (sec.closest(".tone-light") || sec.classList.contains("tone-light")) return;
    const cv = document.createElement("canvas");
    cv.className = "constellation"; cv.setAttribute("aria-hidden", "true");
    sec.prepend(cv);
    const ctx = cv.getContext("2d");
    let g, W, H, vis = false, raf = 0;
    const isFooter = sec.classList.contains("site-footer");
    function layout() {
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = sec.clientWidth; H = sec.clientHeight;
      cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      g = build(W, H, { seed: 101 + idx * 977, conDensity: isFooter ? 260000 : 170000, dustDensity: isFooter ? 9000 : 6000 });
      paint(performance.now());
    }
    // quieter toward the left text column, a little brighter toward the right edge
    const fade = (x, y) => .45 + .55 * Math.min(1, Math.max(0, (x / W - .25) / .5));
    function paint(t) { ctx.clearRect(0, 0, W, H); draw(ctx, g, t, { opacity: isFooter ? .5 : .75, fade }); }
    function loop(t) { paint(t); if (vis && !reduce) raf = requestAnimationFrame(loop); }
    layout();
    new ResizeObserver(() => layout()).observe(sec);
    new IntersectionObserver(e => {
      vis = e[0].isIntersecting; cancelAnimationFrame(raf);
      if (vis && !reduce) raf = requestAnimationFrame(loop);
    }).observe(sec);
  });
})();
