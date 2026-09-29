/* =========================================================
   Sketch: traços "desenhados à mão" em SVG
   Uso no HTML:
     <span data-sketch="circle|underline|highlight|arrow"
           data-sketch-seed="3"          (formato fixo do traço)
           data-sketch-pad="12 8"        (folga horizontal/vertical em px)
           data-sketch-color="#c17a3a"
           data-sketch-width="2"
           data-sketch-delay="400"       (ms)
           data-sketch-trigger="view|load"
           data-sketch-arrow="x1 y1 x2 y2 curva"  (só arrow, frações da caixa)>
   ========================================================= */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = !!window.CG_REDUCE;
  const hosts = new Map();
  let autoSeed = 1;

  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const r1 = (n) => Math.round(n * 10) / 10;

  // Catmull-Rom -> Bézier: curva suave passando por todos os pontos
  function smooth(pts) {
    let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
    }
    return d;
  }

  const shapes = {
    // laço que passa um pouco do ponto inicial, como caneta de verdade
    circle(w, h, r) {
      const cx = w / 2, cy = h / 2;
      const turns = 1.08 + r() * 0.1;
      const a0 = -Math.PI * (0.62 + r() * 0.18);
      const tilt = (r() - 0.5) * 0.09;
      const n = 24, pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = a0 + t * turns * Math.PI * 2;
        const wob = 1 + (r() - 0.5) * 0.06;
        const grow = 0.96 + t * 0.07;
        const x = Math.cos(a) * (w / 2) * wob * grow;
        const y = Math.sin(a) * (h / 2) * wob * grow;
        pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
      }
      return [smooth(pts)];
    },
    // sublinhado com um segundo traço de volta, mais curto
    underline(w, h, r) {
      const y = h - 5, pts = [];
      for (let i = 0; i <= 6; i++) pts.push([w * i / 6, y + (r() - 0.5) * 3.5 - i * 0.5]);
      const back = [[w * 0.9, y + 1.5], [w * 0.52, y + 3.5 + (r() - 0.5) * 2], [w * 0.14, y + 2.5]];
      return [smooth(pts), smooth(back)];
    },
    // grifo de marca-texto atrás da palavra
    highlight(w, h, r) {
      const y = h * 0.6, pts = [];
      for (let i = 0; i <= 5; i++) pts.push([w * i / 5, y + (r() - 0.5) * 3]);
      return [smooth(pts)];
    },
    // pin de localização: gota + bolinha, traço solto
    pin(w, h, r) {
      const cx = w / 2, j = () => (r() - 0.5) * 1.6;
      const drop = [[cx + j(), h], [w * 0.14 + j(), h * 0.5], [w * 0.04, h * 0.3 + j()], [cx * 0.55, h * 0.06], [cx + j(), 0], [w * 0.8, h * 0.07], [w * 0.97, h * 0.32 + j()], [w * 0.86, h * 0.52], [cx + 1.5, h - 1]];
      const cy = h * 0.34, rr = w * 0.17, dot = [];
      for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 + i / 10 * Math.PI * 2.1;
        dot.push([cx + Math.cos(a) * rr * (1 + (r() - 0.5) * 0.15), cy + Math.sin(a) * rr * (1 + (r() - 0.5) * 0.15)]);
      }
      return [smooth(drop), smooth(dot)];
    },
    // linha solta (sem ponta), ex.: divisória do quadro
    line(w, h, r, s) {
      return [shapes.arrow(w, h, r, s)[0]];
    },
    // seta curva com ponta em "V"
    arrow(w, h, r, s) {
      const [fx1, fy1, fx2, fy2, bend = -0.25] = (s.el.dataset.sketchArrow || '0 0.5 1 0.5 -0.25').split(/\s+/).map(Number);
      const x1 = fx1 * w, y1 = fy1 * h, x2 = fx2 * w, y2 = fy2 * h;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
      const cx = (x1 + x2) / 2 + nx * bend * len + (r() - 0.5) * 4;
      const cy = (y1 + y2) / 2 + ny * bend * len + (r() - 0.5) * 4;
      const shaft = `M${r1(x1)} ${r1(y1)} Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`;
      const ang = Math.atan2(y2 - cy, x2 - cx);
      const hl = Math.min(13, len * 0.22);
      const a1 = ang + Math.PI - 0.5 - r() * 0.12, a2 = ang + Math.PI + 0.48 + r() * 0.12;
      const head = `M${r1(x2 + Math.cos(a1) * hl)} ${r1(y2 + Math.sin(a1) * hl)} L${r1(x2)} ${r1(y2)} L${r1(x2 + Math.cos(a2) * hl * 0.9)} ${r1(y2 + Math.sin(a2) * hl * 0.9)}`;
      return [shaft, head];
    }
  };

  const defaults = {
    circle: { pad: '12 8', width: 2 },
    underline: { pad: '0 10', width: 2 },
    highlight: { pad: '6 0', width: 0 },
    arrow: { pad: '0 0', width: 2 },
    pin: { pad: '0 0', width: 1.8 },
    line: { pad: '0 0', width: 1.6 }
  };

  function draw(s) {
    const w = s.el.offsetWidth, h = s.el.offsetHeight;
    if (!w || !h) return;
    const [px, py] = s.pad;
    const W = w + px * 2, H = h + py * 2;
    const m = s.width + 1; // margem para o traço não cortar
    Object.assign(s.svg.style, { left: -px + 'px', top: -py + 'px', width: W + 'px', height: H + 'px' });
    s.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const r = rng(s.seed);
    let paths, strokeW = s.width;
    if (s.type === 'highlight') {
      paths = shapes.highlight(W, H, r);
      strokeW = Math.max(8, H * 0.46);
    } else {
      paths = shapes[s.type](W - m * 2, H - m * 2, r, s);
    }

    s.svg.textContent = '';
    const g = document.createElementNS(NS, 'g');
    if (s.type !== 'highlight') g.setAttribute('transform', `translate(${m} ${m})`);
    paths.forEach((d, i) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.setAttribute('stroke', s.color);
      p.setAttribute('stroke-width', strokeW);
      if (s.type === 'highlight') p.setAttribute('stroke-opacity', '0.38');
      p.style.setProperty('--delay', (s.delay + i * 450) / 1000 + 's');
      if (i > 0) p.style.setProperty('--dur', '.35s');
      g.appendChild(p);
    });
    s.svg.appendChild(g);
  }

  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => { const s = hosts.get(e.target); if (s) draw(s); });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });

  function show(el) {
    const s = hosts.get(el);
    if (s) requestAnimationFrame(() => s.svg.classList.add('is-drawn'));
  }

  function attach(el) {
    if (hosts.has(el)) return;
    const type = el.dataset.sketch;
    if (!shapes[type]) return;
    const d = defaults[type];
    const s = {
      el,
      type,
      pad: (el.dataset.sketchPad || d.pad).split(/\s+/).map(Number),
      color: el.dataset.sketchColor || 'var(--gold-dark)',
      width: Number(el.dataset.sketchWidth || d.width),
      delay: Number(el.dataset.sketchDelay || 0),
      seed: Number(el.dataset.sketchSeed) || (autoSeed++ * 7919)
    };
    if (type === 'highlight') s.color = el.dataset.sketchColor || 'var(--gold)';
    el.classList.add('sketch-host');
    s.svg = document.createElementNS(NS, 'svg');
    s.svg.setAttribute('class', 'sketch-svg sketch-' + type);
    s.svg.setAttribute('aria-hidden', 'true');
    el.appendChild(s.svg);
    hosts.set(el, s);
    draw(s);
    ro.observe(el);

    if (reduceMotion || el.dataset.sketchTrigger === 'load') show(el);
    else io.observe(el);
  }

  function scan(root) {
    (root || document).querySelectorAll('[data-sketch]').forEach(attach);
  }

  // redesenha a animação (ex.: PT | EN trocando de lado)
  function replay(el) {
    const s = hosts.get(el);
    if (!s) return;
    s.svg.classList.remove('is-drawn');
    draw(s);
    void s.svg.getBoundingClientRect();
    show(el);
  }

  function refreshAll() { hosts.forEach(draw); }

  window.Sketch = { scan, attach, replay, refreshAll };
})();
