/* Textos e blocos aparecendo suavemente durante o scroll (.reveal)
   Reveal.init() pode ser chamado de novo para blocos criados depois (ex.: galeria) */
(function () {
  let io = null;
  const vistos = new WeakSet();

  function init(root) {
    const els = [...(root || document).querySelectorAll('.reveal')].filter((e) => !vistos.has(e));
    els.forEach((e) => vistos.add(e));
    if (window.CG_REDUCE || !('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-visible'));
      return;
    }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    els.forEach((e) => io.observe(e));
  }
  window.Reveal = { init };
})();
