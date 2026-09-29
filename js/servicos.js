/* =========================================================
   7. O que podemos criar juntos? 4 cards (2 em cima, 2 embaixo)
   cada card: objetivo (pergunta) + formato + explicação + tags + botão
   "Quero esse formato" leva ao formulário com o serviço já escolhido
   ========================================================= */
(function () {
  let cards = [];

  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  function escolherServico(valor) {
    window.CG_SERVICO = valor;
    document.dispatchEvent(new CustomEvent('servico:escolher', { detail: { valor } }));
    const alvo = document.getElementById('contato');
    if (alvo) alvo.scrollIntoView({ behavior: window.CG_REDUCE ? 'auto' : 'smooth' });
  }

  function textos() {
    cards.forEach((c) => {
      const base = 'servicos.itens.' + c.id;
      c.el.querySelector('.svc-pergunta').textContent = I18N.t(base + '.aba');
      c.el.querySelector('.svc-nome').textContent = I18N.t(base + '.nome');
      c.el.querySelector('.svc-desc').textContent = I18N.t(base + '.desc');
      const tags = I18N.t(base + '.tags') || [];
      c.el.querySelectorAll('.obj-tag').forEach((t, k) => { t.textContent = tags[k] || ''; });
      c.el.querySelector('.svc-btn span').textContent = I18N.t('servicos.botao');
    });
  }

  async function init() {
    const root = document.getElementById('objetivos');
    if (!root) return;
    let data;
    try { data = await (await fetch('data/servicos.json', { cache: 'no-cache' })).json(); } catch (e) { return; }
    root.className = 'svc-grid';

    data.servicos.forEach((s, i) => {
      const card = el('article', 'svc reveal');
      const num = el('span', 'svc-num');
      num.textContent = String(i + 1).padStart(2, '0');

      const info = el('div', 'svc-info');
      const tags = el('ul', 'obj-tags');
      for (let k = 0; k < 3; k++) tags.appendChild(el('li', 'obj-tag'));
      const btn = el('button', 'btn btn-gold svc-btn');
      btn.type = 'button';
      btn.append(el('span'));
      btn.addEventListener('click', () => escolherServico(I18N.t('servicos.itens.' + s.id + '.form')));
      info.append(num, el('h3', 'svc-pergunta'), el('p', 'svc-nome'), el('p', 'svc-desc'), tags, btn);

      card.append(info);
      root.appendChild(card);
      cards.push({ id: s.id, el: card });
    });

    document.querySelectorAll('[data-servico-link]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      escolherServico(a.dataset.servicoLink);
    }));

    textos();
    document.addEventListener('i18n:change', textos);
    if (window.Reveal) Reveal.init(root);
  }

  window.Servicos = { init };
})();
