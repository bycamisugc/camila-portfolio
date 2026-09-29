/* =========================================================
   5. Galeria por nichos (data/nichos.json)
   - menu de nichos com rolagem até cada bloco
   - 5 vídeos por fileira no desktop; setas quando há mais
   - clique abre o vídeo com som em tela cheia
   - YouTube Ads no fim, em 16:9
   ========================================================= */
(function () {
  let data = null;
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const SETA_E = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const SETA_D = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  const capaDe = (v) => v.capa || (v.youtube ? `https://i.ytimg.com/vi/${v.youtube}/oar2.jpg` : '');

  function tagTexto(v) {
    const estilo = v.estilo ? I18N.pick(v.estilo) : '';
    return estilo ? `${v.tipo} • ${estilo}` : v.tipo;
  }

  function card(v, nicho) {
    if (v.pendente) {
      const c = el('div', 'vcard vcard-pending');
      c.append(el('span', 'vcard-pending-brand', v.marca), el('span', 'vcard-pending-title'), el('span', 'vcard-pending-note'));
      return c;
    }
    const c = el('button', 'vcard');
    c.type = 'button';
    const img = el('img', 'vcard-img');
    img.src = capaDe(v);
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (v.youtube) img.addEventListener('error', () => { img.src = `https://i.ytimg.com/vi/${v.youtube}/hqdefault.jpg`; }, { once: true });
    const tag = el('span', 'vcard-tag');
    tag.append(el('b', '', v.marca), el('span', 'vcard-tipo', tagTexto(v)));
    c.append(img, el('span', 'vcard-play', PLAY), tag);
    c._video = v;
    c.addEventListener('click', () => abrir(v, nicho));
    return c;
  }

  /* ---------- player em tela cheia ---------- */
  let modal, frame, lastFocus;
  function abrir(v, nicho) {
    lastFocus = document.activeElement;
    frame.textContent = '';
    frame.classList.toggle('is-wide', !!v.horizontal);
    if (v.youtube) {
      const f = el('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${v.youtube}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.title = v.marca;
      frame.appendChild(f);
    } else {
      const vid = el('video');
      vid.src = v.video;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', '');
      if (v.capa) vid.poster = v.capa;
      frame.appendChild(vid);
      vid.play().catch(() => {});
      let completo = false;
      vid.addEventListener('timeupdate', () => {
        if (!completo && vid.duration && vid.currentTime / vid.duration >= 0.9) {
          completo = true;
          if (window.ccTrackVideoComplete) window.ccTrackVideoComplete(nicho, v.marca);
        }
      });
    }
    if (window.ccTrackVideoStart) window.ccTrackVideoStart(nicho, v.marca);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.documentElement.classList.add('no-scroll');
    modal.querySelector('.vmodal-close').focus();
  }
  function fechar() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    const v = frame.querySelector('video');
    if (v) v.pause();
    setTimeout(() => { modal.hidden = true; frame.textContent = ''; }, 250);
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- setas das fileiras ---------- */
  function syncSetas(row, prev, next) {
    const max = row.scrollWidth - row.clientWidth;
    const tem = max > 4;
    prev.hidden = next.hidden = !tem;
    prev.disabled = row.scrollLeft <= 4;
    next.disabled = row.scrollLeft >= max - 4;
  }

  function bloco(n) {
    const sec = el('section', 'nicho reveal');
    sec.id = 'nicho-' + n.id;
    const head = el('div', 'nicho-head');
    const nome = el('h3', 'nicho-nome');
    const sub = el('p', 'nicho-sub');
    nome._n = n; sub._n = n;
    const prev = el('button', 'nicho-seta', SETA_E);
    const next = el('button', 'nicho-seta', SETA_D);
    prev.type = next.type = 'button';
    prev.dataset.i18nAttr = 'aria-label:galeria.anterior';
    next.dataset.i18nAttr = 'aria-label:galeria.proximo';
    const setas = el('div', 'nicho-setas');
    setas.append(prev, next);
    head.append(el('div', 'nicho-titulos'), setas);
    head.firstChild.append(nome, sub);

    const row = el('div', 'nicho-row');
    n.videos.forEach((v) => row.appendChild(card(v, n.id)));
    const passo = () => row.clientWidth * 0.8;
    prev.addEventListener('click', () => row.scrollBy({ left: -passo(), behavior: 'smooth' }));
    next.addEventListener('click', () => row.scrollBy({ left: passo(), behavior: 'smooth' }));
    row.addEventListener('scroll', () => syncSetas(row, prev, next), { passive: true });
    new ResizeObserver(() => syncSetas(row, prev, next)).observe(row);

    sec.append(head, row);
    return sec;
  }

  function textos() {
    document.querySelectorAll('.nicho-nome').forEach((e) => { if (e._n) e.textContent = I18N.pick(e._n.nome); });
    document.querySelectorAll('.nicho-sub').forEach((e) => { if (e._n) e.textContent = I18N.pick(e._n.sub); });
    document.querySelectorAll('.nicho-menu a').forEach((a) => { a.textContent = I18N.pick(a._n.nome); });
    document.querySelectorAll('.vcard').forEach((c) => {
      if (c._video) {
        c.setAttribute('aria-label', I18N.t('galeria.assistir', { marca: c._video.marca }));
        const t = c.querySelector('.vcard-tipo');
        if (t) t.textContent = tagTexto(c._video);
      }
    });
    document.querySelectorAll('.vcard-pending-title').forEach((e) => { e.textContent = I18N.t('galeria.emBreve'); });
    document.querySelectorAll('.vcard-pending-note').forEach((e) => { e.textContent = I18N.t('galeria.emBreveNota'); });
    I18N.apply(document.getElementById('nichoBlocos'));
  }

  function youtubeAds() {
    const yt = data.youtubeAds;
    const box = document.getElementById('ytPlayer');
    if (!yt || !box) return;
    const v = el('video');
    v.src = yt.video;
    v.poster = yt.capa;
    v.preload = 'metadata';
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    const btn = el('button', 'yt-play', PLAY);
    btn.type = 'button';
    btn.setAttribute('aria-label', I18N.t('galeria.assistir', { marca: yt.marca }));
    const tag = el('span', 'vcard-tag yt-tag');
    tag.append(el('b', '', yt.marca), el('span', 'vcard-tipo', yt.tipo));
    btn.addEventListener('click', () => {
      v.controls = true;
      v.play().catch(() => {});
      btn.remove();
      tag.remove();
      if (window.ccTrackVideoStart) window.ccTrackVideoStart('youtube', yt.marca);
    });
    box.append(v, btn, tag);
  }

  async function init() {
    const blocos = document.getElementById('nichoBlocos');
    if (!blocos) return;
    try { data = await (await fetch('data/nichos.json', { cache: 'no-cache' })).json(); } catch (e) { return; }

    const menu = document.getElementById('nichoMenu');
    data.nichos.forEach((n) => {
      const a = el('a', 'nicho-chip');
      a.href = '#nicho-' + n.id;
      a._n = n;
      menu.appendChild(a);
      blocos.appendChild(bloco(n));
    });

    modal = document.getElementById('vmodal');
    frame = document.getElementById('vmodalFrame');
    modal.querySelector('.vmodal-close').addEventListener('click', fechar);
    modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

    youtubeAds();
    textos();
    document.addEventListener('i18n:change', textos);
    if (window.Reveal) Reveal.init(blocos);
  }

  window.Galeria = { init };
})();
