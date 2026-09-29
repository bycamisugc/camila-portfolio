/* ordem de inicialização */
(async function () {
  await I18N.init();
  Nav.init();
  Hero.init();
  Lightbox.init();
  Sketch.scan();
  Promo.init();
  Reveal.init();
  Marcas.init();
  Destaques.init();
  Galeria.init();
  Fotografia.init();
  Servicos.init();
  Depoimentos.init();
  Metricas.init();
  Contato.init();
  if (document.fonts) document.fonts.ready.then(() => Sketch.refreshAll());
})();
