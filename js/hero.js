/* =========================================================
   HERO: idade calculada a partir da data de nascimento
   e disparo da animação de entrada
   ========================================================= */
(function () {
  const NASCIMENTO = { ano: 1995, mes: 10, dia: 16 };

  function idade(hoje) {
    let n = hoje.getFullYear() - NASCIMENTO.ano;
    const antesDoAniversario = hoje.getMonth() + 1 < NASCIMENTO.mes ||
      (hoje.getMonth() + 1 === NASCIMENTO.mes && hoje.getDate() < NASCIMENTO.dia);
    return antesDoAniversario ? n - 1 : n;
  }

  function renderIdade() {
    const texto = I18N.t('hero.anot.idade', { n: idade(new Date()) });
    document.querySelectorAll('[data-i18n-age]').forEach((el) => { el.textContent = texto; });
  }

  function init() {
    renderIdade();
    document.addEventListener('i18n:change', renderIdade);
    const hero = document.querySelector('.hero');
    if (hero) requestAnimationFrame(() => hero.classList.add('is-in'));
  }

  window.Hero = { init };
})();
