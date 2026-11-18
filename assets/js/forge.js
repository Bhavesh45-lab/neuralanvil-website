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

  let W, H, DPR, planet, stars = [], lights = [], nodes = [], streams = [], ripples = [], lastRipple = 0, lightSpan = 0.4, visible = true;
  let mx = 0, my = 0, px = 0, py = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Anchor the horizon just under the emblem
    let ex = W * 0.72, ey = H * 0.66;
    if (emblem) {
      const r = emblem.getBoundingClientRect(), c = canvas.getBoundingClientRect();
      ex = r.left - c.left + r.width / 2;
      ey = r.top - c.top + r.height * 0.93;
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

    // Neural network nodes in the upper field
    nodes = Array.from({ length: wide ? 70 : 34 }, () => ({
      x: rand(0, W), y: rand(0, H * 0.75), vx: rand(-0.12, 0.12), vy: rand(-0.08, 0.08),
    }));
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

  function network() {
    const link = 150;
    for (const n of nodes) {
      if (!reduce) { n.x += n.vx; n.y += n.vy; }
      if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H * 0.75; if (n.y > H * 0.75) n.y = -20;
    }
    const cx = (mx + 1) * W / 2, cy = (my + 1) * H / 2;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          const near = Math.max(0, 1 - Math.hypot((a.x + b.x) / 2 - cx, (a.y + b.y) / 2 - cy) / 260);
          ctx.strokeStyle = `rgba(80,170,255,${(1 - d / link) * (0.08 + near * 0.35)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const near = Math.max(0, 1 - Math.hypot(a.x - cx, a.y - cy) / 220);
      ctx.fillStyle = `rgba(150,210,255,${0.18 + near * 0.7})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, 1.2 + near * 1.4, 0, 6.283); ctx.fill();
    }
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
    network();
    drawPlanet(t);
    if (!reduce) requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", (e) => {
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = (e.clientY / innerHeight) * 2 - 1;
  });
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
  }

  // Wait for the emblem to load so the horizon lines up under it
  const start = () => { layout(); requestAnimationFrame(frame); setTimeout(layout, 2400); };
  if (emblem && !emblem.complete) emblem.addEventListener("load", () => setTimeout(start, 50), { once: true });
  else setTimeout(start, 50);
})();
