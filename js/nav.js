/* =========================================================
   Menu fixo: fundo translúcido ao rolar, gaveta no mobile,
   chave PT | EN e compensação da altura do header nas âncoras
   ========================================================= */
(function () {
  function init() {
    const root = document.documentElement;
    const header = document.getElementById('siteHeader');
    const burger = document.getElementById('navBurger');
    const drawer = document.getElementById('navDrawer');
    const langBtn = document.getElementById('langToggle');
    const logo = document.getElementById('navLogo');

    // altura real de barra sazonal + menu -> --header-h (usada em padding-top e scroll-margin)
    const setHeaderH = () => root.style.setProperty('--header-h', header.offsetHeight + 'px');
    new ResizeObserver(setHeaderH).observe(header);
    setHeaderH();

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // gaveta mobile
    let open = false;
    function setOpen(v) {
      open = v;
      header.classList.toggle('menu-open', v);
      burger.setAttribute('aria-expanded', String(v));
      burger.setAttribute('aria-label', I18N.t(v ? 'nav.menuFechar' : 'nav.menuAbrir'));
    }
    burger.addEventListener('click', () => setOpen(!open));
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
    document.addEventListener('click', (e) => { if (open && !header.contains(e.target)) setOpen(false); });
    window.matchMedia('(min-width: 900px)').addEventListener('change', () => setOpen(false));

    // logo: volta ao topo
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
    });

    // PT | EN
    langBtn.addEventListener('click', () => I18N.set(I18N.lang === 'pt' ? 'en' : 'pt'));
    function syncLang() {
      langBtn.querySelectorAll('.lang-opt').forEach((opt) => {
        const active = opt.dataset.lang === I18N.lang;
        const was = opt.classList.contains('is-active');
        opt.classList.toggle('is-active', active);
        if (active && !was && window.Sketch) Sketch.replay(opt);
      });
      burger.setAttribute('aria-label', I18N.t(open ? 'nav.menuFechar' : 'nav.menuAbrir'));
    }
    document.addEventListener('i18n:change', syncLang);
    syncLang();
  }

  window.Nav = { init };
})();
