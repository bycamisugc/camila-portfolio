/* =========================================================
   8. Depoimentos: faixa infinita de cards (data/depoimentos.json)
   pausa no hover (desktop) ou ao tocar no card (mobile)
   ========================================================= */
(function () {
  let lista = [];

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
  }

  async function init() {
    const track = document.getElementById('depoTrack');
    const box = document.getElementById('depoMarquee');
    if (!track) return;
    try { lista = (await (await fetch('data/depoimentos.json', { cache: 'no-cache' })).json()).depoimentos; } catch (e) { return; }

    const ul = el('div', 'depo-list');
    lista.forEach((d) => ul.appendChild(card(d, false)));
    const copia = el('div', 'depo-list');
    copia.setAttribute('aria-hidden', 'true');
    lista.forEach((d) => copia.appendChild(card(d, true)));
    track.append(ul, copia);

    // toque no card: pausa / continua (e mostra o texto inteiro)
    track.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const c = e.target.closest('.depo-card');
      box.classList.toggle('is-paused');
      track.querySelectorAll('.depo-card.is-open').forEach((o) => { if (o !== c) o.classList.remove('is-open'); });
      if (c) c.classList.toggle('is-open', box.classList.contains('is-paused'));
    });

    textos();
    document.addEventListener('i18n:change', textos);
  }

  window.Depoimentos = { init };
})();
