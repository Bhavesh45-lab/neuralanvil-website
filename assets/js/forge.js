/* Hero scene: stars, light rays, a planet horizon with an electric-blue
   atmosphere and city lights, and a faint neural network drifting overhead.
   The Neural Anvil emblem (an <img>) floats above it. Pointer adds parallax. */
(() => {
  const canvas = document.getElementById("forge");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const emblem = document.querySelector(".emblem img");
  // Night-side Earth rendered from real geography: the top cap of a globe of radius EARTH_R px
  const EARTH_R = 2400;
  const earth = new Image();
  let earthReady = false;
  if (canvas.dataset.earth) {
    earth.onload = () => { earthReady = true; };
    earth.src = canvas.dataset.earth;
  }

  let W, H, DPR, planet, emC, sky = null, reach = [], stars = [], lights = [], nodes = [], streams = [], ripples = [], lastRipple = 0, lightSpan = 0.4, visible = true;
  let mx = 0, my = 0, px = 0, py = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight; lastW = W;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Anchor the horizon just under the emblem
    let ex = W * 0.72, ey = H * 0.66;
    emC = { x: W * 0.72, y: H * 0.4, r: 160 };
    if (emblem) {
      // Measure the emblem's resting layout position (offsets ignore CSS transforms),
      // so entrance animation, scroll parallax and tilt can never shift the horizon
      const host = canvas.offsetParent || canvas.parentElement;
      let left = 0, top = 0, el = emblem;
      while (el && el !== host) { left += el.offsetLeft; top += el.offsetTop; el = el.offsetParent; }
      const ew = emblem.offsetWidth, eh = emblem.offsetHeight;
      ex = left - canvas.offsetLeft + ew / 2;
      ey = top - canvas.offsetTop + eh * 0.93;
      emC = { x: ex, y: top - canvas.offsetTop + eh * 0.5, r: ew * 0.52 };
    }
    const wide = W > 860;
    const R = wide ? Math.max(W * 1.12, 1350) : W * 2.0;
    planet = { x: ex, y: ey + R, R, top: ey };

    stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({
      x: rand(0, W), y: rand(0, H * 0.9), r: rand(0.3, 1.2), a: rand(0.2, 0.8), t: rand(0, 6.28),
    }));

    // City lights: clustered points stored in polar form so they can drift with the planet's spin
    lights = [];
    const span = wide ? 0.42 : 0.34;
    for (let c = 0; c < 34; c++) {
      const ang = -Math.PI / 2 + rand(-span, span);
      const depth = Math.pow(Math.random(), 1.8) * 0.12;
      const n = Math.round(rand(10, 60));
      for (let i = 0; i < n; i++) {
        lights.push({
          a: ang + rand(-0.025, 0.025),
          d: Math.max(0.003, depth + rand(-0.012, 0.012)),
          r: rand(0.4, 1.4), warm: Math.random() < 0.75, al: rand(0.4, 1), t: rand(0, 6.28),
        });
      }
    }
    lightSpan = span;
    streams = []; ripples = []; lastRipple = 0;

    // Constellation field across the sky (shared with the dark sections)
    if (window.NAConstellation) {
      sky = NAConstellation.build(W, H * 0.8, { seed: 4242, conDensity: wide ? 95000 : 80000, dustDensity: 7000, gold: .14 });
      // a few constellation stars reach toward the neural globe
      reach = sky.stars
        .map(s => ({ s, d: Math.hypot(s.x - emC.x, s.y - emC.y) }))
        .filter(o => o.d > emC.r * 1.25 && o.d < emC.r * 3.4)
        .sort((a, b) => a.d - b.d).slice(0, wide ? 6 : 3)
        .map((o, i) => ({ s: o.s, ph: i * 0.17 }));
    }
  }

  function rays(t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const beams = [
      { x: W * 0.98, w: W * 0.16, a: 0.08, k: -0.55 },
      { x: W * 0.86, w: W * 0.06, a: 0.06, k: -0.62 },
      { x: W * 0.55, w: W * 0.05, a: 0.035, k: -0.4 },
    ];
    for (const b of beams) {
      const flick = reduce ? 1 : 0.8 + Math.sin(t * 0.0004 + b.x) * 0.2;
      ctx.save();
      ctx.translate(b.x, -40);
      ctx.rotate(b.k);
      const g = ctx.createLinearGradient(0, 0, 0, H * 1.4);
      g.addColorStop(0, `rgba(40,150,255,${b.a * flick})`);
      g.addColorStop(1, "rgba(40,150,255,0)");
      ctx.fillStyle = g;
      ctx.filter = "blur(24px)";
      ctx.fillRect(-b.w / 2, 0, b.w, H * 1.4);
      ctx.restore();
    }
    ctx.restore();
    ctx.filter = "none";
  }

  function drawPlanet(t) {
    const { x, y, R } = planet;
    const ox = px * 8, oy = py * 5;

    // Atmosphere halo (outside the planet)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(x + ox, y + oy, R * 0.97, x + ox, y + oy, R * 1.09);
    halo.addColorStop(0, "rgba(40,160,255,0.55)");
    halo.addColorStop(0.25, "rgba(20,120,255,0.22)");
    halo.addColorStop(1, "rgba(10,60,200,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x + ox, y + oy, R * 1.09, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Planet body
    const body = ctx.createRadialGradient(x + ox, y + oy - R * 0.2, R * 0.6, x + ox, y + oy, R);
    body.addColorStop(0, "#010309");
    body.addColorStop(0.88, "#020a1c");
    body.addColorStop(0.97, "#05214a");
    body.addColorStop(0.993, "#0b4596");
    body.addColorStop(1, "#1a7fe0");
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(x + ox, y + oy, R, 0, Math.PI * 2); ctx.fill();

    // Bright rim, strongest where the emblem sits
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const [w, a] of [[12, 0.1], [4, 0.3], [1.4, 0.85]]) {
      const g = ctx.createRadialGradient(x + ox, y + oy - R, 0, x + ox, y + oy - R, R * 0.9);
      g.addColorStop(0, `rgba(150,220,255,${a})`);
      g.addColorStop(0.5, `rgba(40,150,255,${a * 0.6})`);
      g.addColorStop(1, "rgba(40,150,255,0)");
      ctx.strokeStyle = g; ctx.lineWidth = w;
      ctx.beginPath(); ctx.arc(x + ox, y + oy, R - w / 2, Math.PI, Math.PI * 2); ctx.stroke();
    }
    // Glow pool under the emblem
    const pool = ctx.createRadialGradient(x + ox, y + oy - R, 0, x + ox, y + oy - R, 260);
    pool.addColorStop(0, "rgba(90,190,255,0.45)");
    pool.addColorStop(1, "rgba(30,120,255,0)");
    ctx.fillStyle = pool;
    ctx.fillRect(x + ox - 300, y + oy - R - 260, 600, 520);
    ctx.restore();

    // Night Earth texture (India under the emblem), clipped to the planet
    ctx.save();
    if (earthReady) {
      const k = R / EARTH_R;
      ctx.save();
      ctx.beginPath(); ctx.arc(x + ox, y + oy, R, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(earth, x + ox - (earth.width / 2) * k, planet.top + oy, earth.width * k, earth.height * k);
      // gentle twinkle of the city lights
      if (!reduce) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.08 + Math.sin(t * 0.0012) * 0.05;
        ctx.drawImage(earth, x + ox - (earth.width / 2) * k, planet.top + oy, earth.width * k, earth.height * k);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    ctx.globalCompositeOperation = "lighter";

    // Energy ripples spreading across the surface from the touch-down point
    const tx = x + ox, ty = planet.top + oy;
    if (!reduce && t - lastRipple > 3200) { ripples.push({ t0: t }); lastRipple = t; }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const k = (t - ripples[i].t0) / 4200;
      if (k >= 1) { ripples.splice(i, 1); continue; }
      const rx = 30 + k * W * 0.55, ry = rx * 0.09;
      ctx.strokeStyle = `rgba(120,205,255,${(1 - k) * 0.55})`;
      ctx.lineWidth = 1.5 * (1 - k) + 0.3;
      ctx.beginPath(); ctx.ellipse(tx, ty + ry * 0.6, rx, ry, 0, 0, Math.PI); ctx.stroke();
    }

    // Data streams: light rising from the surface into the emblem's base node
    if (!reduce && streams.length < 18 && Math.random() < 0.12) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const a = -Math.PI / 2 + side * rand(0.04, lightSpan * 0.9);
      const rr = R * (1 - rand(0.003, 0.05));
      streams.push({ sx: x + Math.cos(a) * rr, sy: y + Math.sin(a) * rr, k: 0, v: rand(0.006, 0.012), trail: [] });
    }
    for (let i = streams.length - 1; i >= 0; i--) {
      const st = streams[i];
      st.k += st.v;
      if (st.k >= 1) { streams.splice(i, 1); continue; }
      const e = st.k * st.k * (3 - 2 * st.k);
      const cx1 = st.sx + (tx - ox - st.sx) * 0.5, cy1 = planet.top - Math.abs(tx - ox - st.sx) * 0.18;
      const qx = (1 - e) * (1 - e) * st.sx + 2 * (1 - e) * e * cx1 + e * e * (tx - ox);
      const qy = (1 - e) * (1 - e) * st.sy + 2 * (1 - e) * e * cy1 + e * e * (ty - oy);
      st.trail.push([qx + ox, qy + oy]); if (st.trail.length > 14) st.trail.shift();
      for (let j = 1; j < st.trail.length; j++) {
        ctx.strokeStyle = `rgba(110,200,255,${(j / st.trail.length) * 0.7})`;
        ctx.lineWidth = (j / st.trail.length) * 2;
        ctx.beginPath(); ctx.moveTo(st.trail[j - 1][0], st.trail[j - 1][1]); ctx.lineTo(st.trail[j][0], st.trail[j][1]); ctx.stroke();
      }
      ctx.fillStyle = "rgba(220,245,255,0.95)";
      ctx.beginPath(); ctx.arc(qx + ox, qy + oy, 1.6, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  // Copy sits on the left: keep the sky very quiet there so text stays crisp
  const skyFade = (x, y) => {
    const left = Math.min(1, Math.max(0, (x / W - 0.18) / 0.4));
    return 0.3 + 0.7 * left;
  };
  function network(t) {
    if (!sky) return;
    ctx.save(); ctx.translate(-px * 6, -py * 4);
    NAConstellation.draw(ctx, sky, t, { opacity: 1.15, fade: skyFade });
    // connections reaching toward the globe, fading as they arrive
    for (const r of reach) {
      const a = r.s, dx = emC.x - a.x, dy = emC.y - a.y, d = Math.hypot(dx, dy);
      const ex = emC.x - dx / d * emC.r * 0.9, ey = emC.y - dy / d * emC.r * 0.9;
      const gr = ctx.createLinearGradient(a.x, a.y, ex, ey);
      gr.addColorStop(0, "rgba(120,185,255,0.32)"); gr.addColorStop(1, "rgba(120,185,255,0)");
      ctx.strokeStyle = gr; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
      if (!reduce) {
        const f = ((t * 0.00012) + r.ph) % 1, gx = a.x + (ex - a.x) * f, gy = a.y + (ey - a.y) * f;
        ctx.fillStyle = `rgba(190,225,255,${0.5 * Math.sin(Math.PI * f)})`;
        ctx.beginPath(); ctx.arc(gx, gy, 1.3, 0, 6.283); ctx.fill();
      }
    }
    ctx.restore();
  }

  // Sunrise on the horizon, to the right of the emblem: warm gold glow, white-hot core,
  // a horizontal light streak, soft rays and a gold rim along the edge of the Earth.
  function sun(t) {
    const { x, y, R } = planet;
    const ox = px * 8, oy = py * 5;
    const sx0 = Math.min(W * 0.86, x + (W - x) * 0.72);
    const dx = sx0 - x;
    if (Math.abs(dx) >= R) return;
    const sx = sx0 + ox, sy = y - Math.sqrt(R * R - dx * dx) + oy - 2;
    const pulse = reduce ? 1 : 0.92 + Math.sin(t * 0.0007) * 0.08;
    const S = Math.min(W, 1600) / 1536;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // wide warm bloom
    let g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 620 * S);
    g.addColorStop(0, `rgba(255,195,100,${0.7 * pulse})`);
    g.addColorStop(0.18, `rgba(255,160,60,${0.3 * pulse})`);
    g.addColorStop(0.5, `rgba(255,130,40,${0.08 * pulse})`);
    g.addColorStop(1, "rgba(255,120,30,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 620 * S, 0, 6.283); ctx.fill();
    // gold rim hugging the limb on both sides of the sun
    const ang = Math.atan2(sy - oy - y, sx - ox - x), span = 0.32;
    for (const [w, a] of [[10, 0.12], [3.5, 0.35], [1.4, 0.9]]) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x + ox, y + oy, R, ang - span, ang + span);
      const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * span);
      rg.addColorStop(0, `rgba(255,225,160,${a})`);
      rg.addColorStop(0.45, `rgba(255,160,60,${a * 0.45})`);
      rg.addColorStop(1, "rgba(255,140,40,0)");
      ctx.strokeStyle = rg; ctx.lineWidth = w; ctx.stroke();
      ctx.restore();
    }
    // soft rays
    ctx.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i - 6.5) * 0.2 + (reduce ? 0 : Math.sin(t * 0.0002 + i) * 0.02);
      const len = (140 + ((i * 53) % 120)) * S * pulse;
      const lg = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
      lg.addColorStop(0, "rgba(255,215,150,0.22)"); lg.addColorStop(1, "rgba(255,180,90,0)");
      ctx.strokeStyle = lg; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len); ctx.stroke();
    }
    // horizontal streak
    ctx.save(); ctx.translate(sx, sy); ctx.scale(1, 0.06);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 380 * S);
    g.addColorStop(0, `rgba(255,230,180,${0.75 * pulse})`); g.addColorStop(1, "rgba(255,170,80,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 380 * S, 0, 6.283); ctx.fill();
    ctx.restore();
    // core
    g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 60 * S);
    g.addColorStop(0, "rgba(255,255,245,1)");
    g.addColorStop(0.18, "rgba(255,240,200,0.9)");
    g.addColorStop(0.5, "rgba(255,190,100,0.3)");
    g.addColorStop(1, "rgba(255,160,60,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 60 * S, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function frame(t) {
    if (!W || !H || !visible) { if (!reduce) requestAnimationFrame(frame); return; }
    px += (mx - px) * 0.05; py += (my - py) * 0.05;
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const tw = reduce ? 1 : 0.6 + Math.sin(t * 0.001 + s.t) * 0.4;
      ctx.fillStyle = `rgba(200,225,255,${s.a * tw})`;
      ctx.fillRect(s.x - px * 3, s.y - py * 3, s.r, s.r);
    }
    rays(t);
    network(t);
    drawPlanet(t);
    sun(t);
    if (!reduce) requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", (e) => {
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = (e.clientY / innerHeight) * 2 - 1;
  });
  // Phones fire resize when the address bar shows or hides while scrolling.
  // Only rebuild when the width changes (rotation, window resize) so the Earth stays put.
  let rt, lastW = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (canvas.clientWidth !== lastW || Math.abs(canvas.clientHeight - H) > 2) layout(); }, 150);
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  }

  // Wait for the emblem to load so the horizon lines up under it
  const start = () => { layout(); requestAnimationFrame(frame); setTimeout(layout, 2400); };
  if (emblem && !emblem.complete) emblem.addEventListener("load", () => setTimeout(start, 50), { once: true });
  else setTimeout(start, 50);
})();
