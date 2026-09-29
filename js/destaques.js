/* =========================================================
   3. Conteúdos que bombaram: carrossel coverflow em loop infinito
   - só o vídeo do centro toca (mudo); ao sair do centro pausa e volta ao início
   - som liberado só pelo botão; o próximo slide sempre começa mudo
   - arraste no celular, setas no desktop, pontinhos embaixo
   ========================================================= */
(function () {
  const ICON_MUDO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  const ICON_SOM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 010 7M19.5 5.5a9 9 0 010 13"/></svg>';

  let slides = [], dots = [], data = null, cur = 0, n = 0, visivel = false, lastD = [];

  const wrapD = (i) => {
    let d = (i - cur) % n;
    if (d < -Math.floor(n / 2)) d += n;
    if (d >= Math.ceil(n / 2)) d -= n;
    return d;
  };

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function buildSlide(item, i) {
    const slide = el('div', 'cf-slide');
    slide.dataset.index = i;
    const card = el('div', 'cf-card');
    slide.appendChild(card);

    if (item.pendente) {
      card.classList.add('cf-pending');
      card.append(
        el('span', 'cf-pending-brand', item.marca),
        el('span', 'cf-pending-title'),
        el('span', 'cf-pending-note')
      );
      card.querySelector('.cf-pending-note').dataset.arquivo = item.video;
    } else {
      const v = document.createElement('video');
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('muted', '');
      v.preload = 'metadata';
      if (item.capa) v.poster = item.capa;
      v.src = item.video;
      card.appendChild(v);

      const mute = el('button', 'cf-mute', ICON_MUDO);
      mute.type = 'button';
      mute.addEventListener('click', (e) => {
        e.stopPropagation();
        v.muted = !v.muted;
        if (!v.muted && v.paused) v.play().catch(() => {});
        syncMute(slide);
      });
      card.appendChild(mute);

      // clique no vídeo central: pausa / continua
      v.addEventListener('click', () => {
        if (Number(slide.dataset.index) !== cur) return;
        if (v.paused) v.play().catch(() => {}); else v.pause();
      });
    }

    card.appendChild(el('span', 'cf-tag', item.marca));

    if (item.extra) {
      const b = el('button', 'cf-extra');
      b.type = 'button';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        Lightbox.open(item.extra.imagem, I18N.pick(item.extra.texto) + ' · ' + item.marca);
      });
      b._extra = item.extra;
      card.appendChild(b);
    }

    slide.addEventListener('click', () => {
      const i2 = Number(slide.dataset.index);
      if (i2 !== cur) go(i2);
    });
    return slide;
  }

  function syncMute(slide) {
    const v = slide.querySelector('video');
    const b = slide.querySelector('.cf-mute');
    if (!v || !b) return;
    b.innerHTML = v.muted ? ICON_MUDO : ICON_SOM;
    b.setAttribute('aria-label', I18N.t(v.muted ? 'destaques.somLigar' : 'destaques.somDesligar'));
    b.classList.toggle('is-on', !v.muted);
  }

  function textos() {
    slides.forEach((s) => {
      const t = s.querySelector('.cf-pending-title');
      if (t) t.textContent = I18N.t('destaques.pendente');
      const nota = s.querySelector('.cf-pending-note');
      if (nota) nota.textContent = I18N.t('destaques.pendenteNota', { arquivo: nota.dataset.arquivo });
      const ex = s.querySelector('.cf-extra');
      if (ex) ex.textContent = I18N.pick(ex._extra.texto) + ' ↗';
      syncMute(s);
    });
    dots.forEach((d, i) => d.setAttribute('aria-label', I18N.t('destaques.irPara', { n: i + 1 })));
  }

  function naTela() {
    const r = document.getElementById('cflow').getBoundingClientRect();
    return r.bottom > window.innerHeight * 0.2 && r.top < window.innerHeight * 0.8;
  }

  function playCenter() {
    if (!visivel && naTela()) visivel = true;
    slides.forEach((s, i) => {
      const v = s.querySelector('video');
      if (!v) return;
      if (i === cur && visivel) {
        v.play().catch(() => {});
      } else if (i !== cur || !visivel) {
        v.pause();
      }
    });
  }

  function render(first) {
    slides.forEach((s, i) => {
      const d = wrapD(i);
      const jump = !first && Math.abs(d - lastD[i]) > 1;
      const ad = Math.abs(d);
      s.classList.toggle('is-center', d === 0);
      s.style.setProperty('--d', d);
      s.style.zIndex = String(10 - ad);
      s.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      s.querySelectorAll('button').forEach((b) => { b.tabIndex = d === 0 ? 0 : -1; });
      const op = d === 0 ? 1 : ad === 1 ? 0.4 : 0;
      if (jump) {
        // slide que dá a volta por trás: reposiciona sem animar e só faz o fade
        s.style.transition = 'none';
        s.style.opacity = '0';
        s.style.transform = transformFor(d);
        void s.offsetWidth;
        s.style.transition = '';
      } else {
        s.style.transform = transformFor(d);
      }
      s.style.opacity = String(op);
      s.style.pointerEvents = ad <= 1 ? 'auto' : 'none';
      lastD[i] = d;
    });
    dots.forEach((dt, i) => {
      dt.classList.toggle('is-active', i === cur);
      dt.setAttribute('aria-current', i === cur ? 'true' : 'false');
    });
  }

  const transformFor = (d) =>
    `translateX(calc(${d} * var(--cf-step))) scale(${d === 0 ? 1 : 0.85})`;

  function go(i) {
    const prev = cur;
    cur = ((i % n) + n) % n;
    if (prev === cur) return;
    const pv = slides[prev].querySelector('video');
    if (pv) { pv.pause(); pv.currentTime = 0; pv.muted = true; syncMute(slides[prev]); }
    const nv = slides[cur].querySelector('video');
    if (nv) { nv.muted = true; syncMute(slides[cur]); }
    render();
    playCenter();
  }

  function swipe(stage) {
    let x0 = null, y0 = 0, id = null;
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; id = e.pointerId; });
    stage.addEventListener('pointerup', (e) => {
      if (x0 == null || e.pointerId !== id) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        go(cur + (dx < 0 ? 1 : -1));
      }
    });
    stage.addEventListener('pointercancel', () => { x0 = null; });
  }

  async function init() {
    const root = document.getElementById('cflow');
    if (!root) return;
    try { data = await (await fetch('data/destaques.json', { cache: 'no-cache' })).json(); } catch (e) { return; }
    const stage = document.getElementById('cflowStage');
    const dotsWrap = document.getElementById('cflowDots');
    n = data.videos.length;
    cur = Math.min(data.inicio || 0, n - 1);

    slides = data.videos.map(buildSlide);
    stage.append(...slides);
    dots = data.videos.map((_, i) => {
      const b = el('button', 'cf-dot');
      b.type = 'button';
      b.addEventListener('click', () => go(i));
      dotsWrap.appendChild(b);
      return b;
    });

    root.querySelectorAll('.cflow-nav').forEach((b) =>
      b.addEventListener('click', () => go(cur + Number(b.dataset.dir))));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(cur + 1);
      if (e.key === 'ArrowLeft') go(cur - 1);
    });
    swipe(stage);

    render(true);
    textos();
    document.addEventListener('i18n:change', textos);

    // só toca quando a seção está na tela
    new IntersectionObserver((entries) => {
      visivel = entries[entries.length - 1].isIntersecting;
      playCenter();
    }, { threshold: 0.35 }).observe(root);
    playCenter();
  }

  window.Destaques = { init };
})();
