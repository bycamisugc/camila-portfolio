/* =========================================================
   6. Fotografia: moodboard editorial (data/fotos.json)
   posições no desktop definidas no CSS (.mb-item:nth-child)
   ========================================================= */
(function () {
  let fotos = [];

  function textos() {
    document.querySelectorAll('.mb-item').forEach((b, i) => {
      const f = fotos[i];
      if (!f || f.pendente) return;
      const alt = I18N.pick(f.alt);
      b.querySelector('img').alt = alt;
      b.setAttribute('aria-label', I18N.t('fotografia.ampliar', { alt }));
    });
  }

  async function init() {
    const board = document.getElementById('moodboard');
    if (!board) return;
    try { fotos = (await (await fetch('data/fotos.json', { cache: 'no-cache' })).json()).fotos; } catch (e) { return; }

    fotos.forEach((f, i) => {
      if (f.pendente) {
        const d = document.createElement('div');
        d.className = 'mb-item mb-pending';
        d.textContent = 'placeholder ' + String(i + 1).padStart(2, '0');
        board.appendChild(d);
        return;
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mb-item reveal';
      const img = document.createElement('img');
      img.src = f.arquivo;
      // tamanho fixo antes de carregar: a página não "pula" enquanto as fotos chegam
      if (f.largura && f.altura) { img.width = f.largura; img.height = f.altura; }
      img.loading = 'lazy';
      img.decoding = 'async';
      b.append(img);
      b.addEventListener('click', () => Lightbox.open(f.arquivo, I18N.pick(f.alt)));
      board.appendChild(b);
    });

    textos();
    document.addEventListener('i18n:change', textos);
    if (window.Reveal) Reveal.init(board);
  }

  window.Fotografia = { init };
})();
