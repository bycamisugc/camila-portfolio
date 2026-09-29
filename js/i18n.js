/* =========================================================
   Tradução PT | EN
   - textos em i18n/pt.json e i18n/en.json
   - data-i18n="chave"        -> texto puro
   - data-i18n-html="chave"   -> aceita <em>, <br>, <strong>
   - data-i18n-attr="aria-label:chave, placeholder:chave"
   - idioma salvo em localStorage, padrão PT
   ========================================================= */
(function () {
  const KEY = 'cg-lang';
  const SUPPORTED = ['pt', 'en'];
  const cache = {};
  let lang = 'pt';
  try {
    const saved = localStorage.getItem(KEY);
    if (SUPPORTED.includes(saved)) lang = saved;
  } catch (e) { /* sem storage: fica em PT */ }

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

  function t(key, vars) {
    let v = get(cache[lang], key);
    if (v == null) v = get(cache.pt, key);
    if (v == null) return '';
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return v;
  }

  async function load(l) {
    if (!cache[l]) {
      const res = await fetch(`i18n/${l}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error('i18n ' + l);
      cache[l] = await res.json();
    }
    return cache[l];
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    if (!root) {
      document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
      document.title = t('meta.title');
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', t('meta.description'));
    }
  }

  // guarda um elemento visível como âncora para a página não "pular" ao trocar o idioma
  function captureAnchor() {
    if (window.scrollY < 4) return null;
    const header = document.getElementById('siteHeader');
    const y = (header ? header.offsetHeight : 0) + (window.innerHeight * 0.25);
    const el = document.elementFromPoint(window.innerWidth / 2, y);
    return el ? { el, top: el.getBoundingClientRect().top } : null;
  }
  function restoreAnchor(a) {
    if (!a || !a.el.isConnected) return;
    const diff = a.el.getBoundingClientRect().top - a.top;
    if (Math.abs(diff) > 0.5) window.scrollBy({ top: diff, behavior: 'instant' });
  }

  function emit() {
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
  }

  async function set(l) {
    if (!SUPPORTED.includes(l) || l === lang) return;
    await load(l);
    const anchor = captureAnchor();
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* ok */ }
    apply();
    emit();
    restoreAnchor(anchor);
  }

  async function init() {
    await load('pt');
    if (lang !== 'pt') {
      try { await load(lang); } catch (e) { lang = 'pt'; }
    }
    apply();
    document.documentElement.classList.remove('i18n-loading');
    emit();
  }

  window.I18N = {
    init, set, t, apply,
    get lang() { return lang; },
    // pega o valor no idioma atual de um objeto {pt, en} vindo dos .json de dados
    pick(obj) { return obj ? (obj[lang] || obj.pt || '') : ''; }
  };
})();
