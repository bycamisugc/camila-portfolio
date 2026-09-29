/* =========================================================
   8. Depoimentos: faixa infinita de cards (data/depoimentos.json)
   - rola sozinha da direita pra esquerda (volta completa em ~60s)
   - pausa no hover (desktop) ou ao tocar no card (mobile)
   - setas avançam / voltam um card
   ========================================================= */
(function () {
  const VOLTA_S = 60;
  let lista = [], track, box, pos = 0, largura = 0, passo = 0;
  let pausadoHover = false, pausadoToque = false, animando = null, ultimo = 0;

  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  function card(d, clone) {
    const c = el('article', 'depo-card');
    const topo = el('div', 'depo-topo');
    const logo = el('img', 'depo-logo');
    logo.src = d.logo;
    logo.alt = clone ? '' : d.marca;
    logo.loading = 'lazy';
    const quem = el('div', 'depo-quem');
    quem.appendChild(el('b', 'depo-marca', d.marca));
    if (d.instagram) {
      const a = el('a', 'depo-ig', d.instagram);
      a.href = 'https://instagram.com/' + d.instagram.replace(/^@/, '');
      a.target = '_blank';
      a.rel = 'noopener';
      if (clone) a.tabIndex = -1;
      quem.appendChild(a);
    }
    topo.append(logo, quem);
    c.append(topo, el('p', 'depo-titulo'), el('blockquote', 'depo-texto'));
    c._d = d;
    return c;
  }

  function textos() {
    document.querySelectorAll('.depo-card').forEach((c) => {
      const t = I18N.pick(c._d.titulo);
      const tit = c.querySelector('.depo-titulo');
      tit.textContent = t;
      tit.hidden = !t;
      const txt = I18N.pick(c._d.texto);
      c.querySelector('.depo-texto').textContent = '“' + txt + '”';
      c.title = txt;
    });
    medir();
  }

  function medir() {
    const ul = track.firstElementChild;
    if (!ul) return;
    largura = ul.getBoundingClientRect().width;
    const c = ul.querySelector('.depo-card');
    const gap = parseFloat(getComputedStyle(ul).columnGap) || 24;
    passo = c ? c.getBoundingClientRect().width + gap : 360;
  }

  function normalizar() {
    if (!largura) return;
    while (pos <= -largura) pos += largura;
    while (pos > 0) pos -= largura;
  }

  function desenhar() { track.style.transform = `translate3d(${pos}px,0,0)`; }

  function loop(t) {
    const dt = ultimo ? Math.min(0.1, (t - ultimo) / 1000) : 0;
    ultimo = t;
    if (!animando && !pausadoHover && !pausadoToque && largura) {
      pos -= (largura / VOLTA_S) * dt;
      normalizar();
      desenhar();
    }
    requestAnimationFrame(loop);
  }

  // seta: desliza um card com animação suave
  function mover(dir) {
    const de = pos, para = pos - dir * passo, t0 = performance.now(), dur = 450;
    animando = true;
    function f(t) {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      pos = de + (para - de) * e;
      normalizar();
      desenhar();
      if (p < 1) requestAnimationFrame(f); else animando = false;
    }
    requestAnimationFrame(f);
  }

  async function init() {
    track = document.getElementById('depoTrack');
    box = document.getElementById('depoMarquee');
    if (!track) return;
    try { lista = (await (await fetch('data/depoimentos.json', { cache: 'no-cache' })).json()).depoimentos; } catch (e) { return; }

    const ul = el('div', 'depo-list');
    lista.forEach((d) => ul.appendChild(card(d, false)));
    const copia = el('div', 'depo-list');
    copia.setAttribute('aria-hidden', 'true');
    lista.forEach((d) => copia.appendChild(card(d, true)));
    track.append(ul, copia);

    box.addEventListener('mouseenter', () => { pausadoHover = true; });
    box.addEventListener('mouseleave', () => { pausadoHover = false; });

    // toque no card: pausa / continua (e mostra o texto inteiro)
    track.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const c = e.target.closest('.depo-card');
      pausadoToque = !pausadoToque;
      track.querySelectorAll('.depo-card.is-open').forEach((o) => { if (o !== c) o.classList.remove('is-open'); });
      if (c) c.classList.toggle('is-open', pausadoToque);
      medir();
    });

    document.querySelectorAll('[data-depo-dir]').forEach((b) =>
      b.addEventListener('click', () => mover(Number(b.dataset.depoDir))));

    textos();
    document.addEventListener('i18n:change', textos);
    window.addEventListener('resize', medir);
    if (document.fonts) document.fonts.ready.then(medir);
    requestAnimationFrame(loop);
  }

  window.Depoimentos = { init };
})();
