/* =========================================================
   9. Métricas: colagem de prints + contador animado
   (data/metricas.json)
   ========================================================= */
(function () {
  let data = null;
  const feitos = new Set();

  function formatar(bloco, n) {
    const b = data[bloco];
    const num = n.toLocaleString(I18N.lang === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: b.casas, maximumFractionDigits: b.casas });
    return I18N.pick(b.prefixo) + num + I18N.pick(b.sufixo);
  }

  function contar(el) {
    const bloco = el.dataset.count;
    const alvo = data[bloco].valor;
    if (window.CG_REDUCE || feitos.has(bloco)) { el.textContent = formatar(bloco, alvo); feitos.add(bloco); return; }
    feitos.add(bloco);
    const dur = 1600, t0 = performance.now();
    function passo(t) {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = formatar(bloco, alvo * e);
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function prints(bloco) {
    const box = document.querySelector(`[data-prints="${bloco}"]`);
    data[bloco].prints.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'polaroid';
      b.style.setProperty('--i', i);
      const img = document.createElement('img');
      img.src = p.arquivo;
      img.loading = 'lazy';
      img.decoding = 'async';
      b.append(img, Object.assign(document.createElement('span'), { className: 'fita' }));
      b._p = p;
      b.addEventListener('click', () => Lightbox.open(p.arquivo, I18N.pick(p.alt)));
      box.appendChild(b);
    });
  }

  function textos() {
    document.querySelectorAll('.polaroid').forEach((b) => {
      const alt = I18N.pick(b._p.alt);
      b.querySelector('img').alt = alt;
      b.setAttribute('aria-label', I18N.t('metricas.ampliar', { alt }));
    });
    document.querySelectorAll('.mt-count').forEach((el) => {
      if (feitos.has(el.dataset.count)) el.textContent = formatar(el.dataset.count, data[el.dataset.count].valor);
      else el.textContent = formatar(el.dataset.count, 0);
    });
  }

  async function init() {
    if (!document.getElementById('metricas')) return;
    try { data = await (await fetch('data/metricas.json', { cache: 'no-cache' })).json(); } catch (e) { return; }
    prints('tiktok');
    prints('instagram');
    textos();
    document.addEventListener('i18n:change', textos);
    const io = new IntersectionObserver((en) => en.forEach((e) => {
      if (e.isIntersecting) { contar(e.target); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    document.querySelectorAll('.mt-count').forEach((el) => io.observe(el));
  }

  window.Metricas = { init };
})();
