/* =========================================================
   7. O que podemos criar juntos? Seletor de objetivo
   - desktop: 4 abas lado a lado + painel grande abaixo
   - mobile: acordeão (cada objetivo abre o seu painel logo abaixo)
   - "Quero esse formato" leva ao formulário com o serviço já escolhido
   ========================================================= */
(function () {
  let itens = [], ativo = 0, visivel = false;

  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  // escolhe o serviço no formulário de contato e rola até ele
  function escolherServico(valor) {
    window.CG_SERVICO = valor;
    document.dispatchEvent(new CustomEvent('servico:escolher', { detail: { valor } }));
    const alvo = document.getElementById('contato');
    if (alvo) alvo.scrollIntoView({ behavior: window.CG_REDUCE ? 'auto' : 'smooth' });
  }

  function sincronizarVideos() {
    itens.forEach((it, i) => {
      const v = it.painel.querySelector('video');
      if (!v) return;
      if (i === ativo && visivel) v.play().catch(() => {});
      else v.pause();
    });
  }

  function abrir(i, foco) {
    ativo = i;
    itens.forEach((it, k) => {
      const on = k === i;
      it.aba.classList.toggle('is-active', on);
      it.aba.setAttribute('aria-selected', String(on));
      it.aba.setAttribute('aria-expanded', String(on));
      it.aba.tabIndex = on ? 0 : -1;
      it.painel.hidden = !on;
      it.painel.classList.remove('is-in');
    });
    const p = itens[i].painel;
    requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('is-in')));
    if (foco) itens[i].aba.focus();
    sincronizarVideos();
  }

  function textos() {
    itens.forEach((it) => {
      const base = 'servicos.itens.' + it.id;
      it.aba.querySelector('.obj-aba-txt').textContent = I18N.t(base + '.aba');
      it.painel.querySelector('.obj-nome').textContent = I18N.t(base + '.nome');
      it.painel.querySelector('.obj-desc').textContent = I18N.t(base + '.desc');
      const tags = I18N.t(base + '.tags') || [];
      it.painel.querySelectorAll('.obj-tag').forEach((t, k) => { t.textContent = tags[k] || ''; });
      it.painel.querySelector('.obj-btn span').textContent = I18N.t('servicos.botao');
    });
  }

  async function init() {
    const root = document.getElementById('objetivos');
    if (!root) return;
    let data;
    try { data = await (await fetch('data/servicos.json', { cache: 'no-cache' })).json(); } catch (e) { return; }
    root.setAttribute('role', 'tablist');

    data.servicos.forEach((s, i) => {
      const aba = el('button', 'obj-aba');
      aba.type = 'button';
      aba.id = 'obj-aba-' + s.id;
      aba.setAttribute('role', 'tab');
      aba.setAttribute('aria-controls', 'obj-painel-' + s.id);
      const num = el('span', 'obj-aba-num');
      num.textContent = String(i + 1).padStart(2, '0');
      aba.append(num, el('span', 'obj-aba-txt'));
      aba.addEventListener('click', () => abrir(i));
      aba.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); abrir((i + 1) % data.servicos.length, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); abrir((i - 1 + data.servicos.length) % data.servicos.length, true); }
      });

      const painel = el('div', 'obj-painel');
      painel.id = 'obj-painel-' + s.id;
      painel.setAttribute('role', 'tabpanel');
      painel.setAttribute('aria-labelledby', aba.id);

      const info = el('div', 'obj-info');
      const tags = el('ul', 'obj-tags');
      for (let k = 0; k < 3; k++) tags.appendChild(el('li', 'obj-tag'));
      const btn = el('button', 'btn btn-gold obj-btn');
      btn.type = 'button';
      btn.append(el('span'));
      btn.addEventListener('click', () => escolherServico(I18N.t('servicos.itens.' + s.id + '.form')));
      info.append(el('p', 'obj-nome'), el('p', 'obj-desc'), tags, btn);

      const media = el('div', 'obj-media');
      const v = el('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = false;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.preload = 'metadata';
      if (s.capa) v.poster = s.capa;
      v.src = s.video;
      media.appendChild(v);

      painel.append(media, info);
      root.append(aba, painel);
      itens.push({ id: s.id, aba, painel });
    });

    // links "Bora conversar" também preenchem o formulário
    document.querySelectorAll('[data-servico-link]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      escolherServico(a.dataset.servicoLink);
    }));

    textos();
    document.addEventListener('i18n:change', textos);
    abrir(0);

    new IntersectionObserver((en) => {
      visivel = en[en.length - 1].isIntersecting;
      sincronizarVideos();
    }, { threshold: 0.25 }).observe(root);
  }

  window.Servicos = { init };
})();
