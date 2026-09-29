/* =========================================================
   Barra sazonal: lê data/campanha.json
   - mostra a primeira campanha (pela dataEvento) que ainda não
     terminou (dataFim) e já começou (dataInicio, opcional)
   - contagem regressiva automática, atualiza sozinha na virada do dia
   - sem campanha ativa: mensagemPadrao
   ========================================================= */
(function () {
  const SPEED = 55; // px por segundo, velocidade constante
  const DAY = 864e5;
  let data = null;
  let lastDay = null;

  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

  function current() {
    const t = today();
    return (data.campanhas || [])
      .filter((c) => parse(c.dataFim) >= t && (!c.dataInicio || parse(c.dataInicio) <= t))
      .sort((a, b) => parse(a.dataEvento) - parse(b.dataEvento))[0] || null;
  }

  function countdown(c) {
    const days = Math.round((parse(c.dataEvento) - today()) / DAY);
    if (days > 1) return I18N.t('promo.faltamDias', { n: days });
    if (days === 1) return I18N.t('promo.faltaUmDia');
    if (days === 0) return I18N.t('promo.hoje');
    return I18N.t('promo.durante');
  }

  function span(cls, text) {
    const s = document.createElement('span');
    s.className = cls;
    if (text != null) s.textContent = text;
    return s;
  }

  function buildItem(c) {
    const item = span('promo-item');
    if (c) {
      const hl = span('promo-hl');
      Object.assign(hl.dataset, { sketch: 'circle', sketchSeed: '21', sketchPad: '12 8', sketchWidth: '1.6', sketchColor: 'var(--gold)', sketchTrigger: 'load', sketchDelay: '300' });
      hl.appendChild(span('', I18N.pick(c.destaque)));
      item.append(hl, span('promo-sep', '·'), span('promo-count', countdown(c)), span('promo-sep', '·'), span('promo-msg', I18N.pick(c.mensagem)));
    } else {
      item.append(span('promo-msg', I18N.pick(data.mensagemPadrao)), span('promo-sep', '·'));
    }
    return item;
  }

  function build() {
    if (!data) return;
    const track = document.getElementById('promoTrack');
    const bar = document.getElementById('promoBar');
    const c = current();
    lastDay = today().getTime();

    track.textContent = '';
    const group = document.createElement('span');
    group.className = 'promo-group';
    const item = buildItem(c);
    group.appendChild(item);
    track.appendChild(group);

    // repete a frase até cobrir a largura, depois duplica o grupo para o loop sem pulo
    const vw = track.parentElement.offsetWidth || window.innerWidth;
    let guard = 0;
    while (group.offsetWidth < vw && guard++ < 30) group.appendChild(item.cloneNode(true));
    track.appendChild(group.cloneNode(true));
    track.style.setProperty('--promo-dur', (group.offsetWidth / SPEED).toFixed(2) + 's');

    const label = c
      ? `${I18N.pick(c.destaque)}, ${countdown(c)}, ${I18N.pick(c.mensagem)}`
      : I18N.pick(data.mensagemPadrao);
    bar.setAttribute('aria-label', `${label}. ${I18N.t('promo.aria')}`);

    if (window.Sketch) Sketch.scan(track);
  }

  let resizeT;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(build, 200);
  }

  async function init() {
    try {
      const res = await fetch('data/campanha.json', { cache: 'no-cache' });
      data = await res.json();
    } catch (e) {
      data = { campanhas: [], mensagemPadrao: { pt: '', en: '' } };
    }
    build();
    document.addEventListener('i18n:change', build);
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; onResize(); } });
    if (document.fonts) document.fonts.ready.then(build);
    // confere a virada do dia (aba aberta de um dia pro outro)
    setInterval(() => { if (today().getTime() !== lastDay) build(); }, 60 * 1000);
  }

  window.Promo = { init };
})();
