/* =========================================================
   7. O que podemos criar juntos? 4 cards pequenos lado a lado
   cada card: nome do serviço + descrição
   "Bora conversar" leva ao formulário
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
      c.el.querySelector('.svc-nome').textContent = I18N.t(base + '.nome');
      c.el.querySelector('.svc-desc').textContent = I18N.t(base + '.desc');
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
      info.append(num, el('h3', 'svc-nome'), el('p', 'svc-desc'));

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
