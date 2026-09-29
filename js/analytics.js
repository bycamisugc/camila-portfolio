/* =========================================================
   Analytics + leads (Supabase) — mesma lógica e mesmas tabelas do site anterior:
   page_views, section_time, video_views e leads (lidos pelo admin.html)
   ========================================================= */
(function () {
  const SUPABASE_URL = 'https://qtinzryawlukyubzgyum.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_Gv6V0sniXN_fVoECZxOkZw_D8SvN-UW';

  function ccInsert(table, row) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row),
      keepalive: true
    }).then(function (r) { return r.ok; }).catch(function () { return false; /* falha silenciosa */ });
  }
  window.ccInsert = ccInsert;

  let sessionId = null, origem = 'direto', isNewVisitor = false;
  try {
    sessionId = sessionStorage.getItem('cc_session_id');
    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : 'cc-' + Date.now() + '-' + Math.random().toString(36).slice(2));
      sessionStorage.setItem('cc_session_id', sessionId);
    }
    isNewVisitor = !localStorage.getItem('cc_visited_before');
    if (isNewVisitor) localStorage.setItem('cc_visited_before', '1');
    const urlOrigem = new URLSearchParams(location.search).get('origem');
    origem = urlOrigem || sessionStorage.getItem('cc_origem') || 'direto';
    sessionStorage.setItem('cc_origem', origem);
  } catch (e) {
    sessionId = sessionId || 'cc-' + Date.now();
  }
  window.ccSessionId = sessionId;
  window.ccOrigem = origem;

  const device = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

  window.ccGetUltimoNicho = function () {
    try { return sessionStorage.getItem('cc_last_nicho') || null; } catch (e) { return null; }
  };

  // visita (não registra em ambiente de teste local)
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (!local) {
    ccInsert('page_views', { session_id: sessionId, origem: origem, device: device, is_new_session: isNewVisitor });
  }

  // tempo por seção: nomes antigos mantidos onde a seção é equivalente
  const SECOES = { inicio: 'inicio', destaques: 'cases', nichos: 'videos', servicos: 'servicos', metricas: 'metricas', contato: 'contato' };
  const timers = {};
  Object.keys(SECOES).forEach((id) => { timers[id] = { start: null, total: 0 }; });

  function startObserver() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const t = timers[entry.target.id];
        if (!t) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          if (t.start === null) t.start = Date.now();
        } else if (t.start !== null) {
          t.total += (Date.now() - t.start) / 1000;
          t.start = null;
        }
      });
    }, { threshold: [0, 0.35, 1] });
    Object.keys(SECOES).forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver); else startObserver();

  function flush() {
    Object.keys(SECOES).forEach((id) => {
      const t = timers[id];
      if (t.start !== null) { t.total += (Date.now() - t.start) / 1000; t.start = null; }
      if (t.total >= 1) {
        if (!local) ccInsert('section_time', { session_id: sessionId, section: SECOES[id], seconds: Math.round(t.total) });
        t.total = 0;
      }
    });
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);

  // vídeos: início e conclusão (90%+)
  window.ccTrackVideoStart = function (niche, marca) {
    try { sessionStorage.setItem('cc_last_nicho', niche); } catch (e) { /* ok */ }
    if (!local) ccInsert('video_views', { session_id: sessionId, niche: niche, marca: marca, event: 'start' });
  };
  window.ccTrackVideoComplete = function (niche, marca) {
    if (!local) ccInsert('video_views', { session_id: sessionId, niche: niche, marca: marca, event: 'complete' });
  };

  // lead: grava no Supabase (usado pelos dois formulários). Leads SEMPRE são gravados, até em teste.
  window.ccSubmitLead = function (payload) {
    return ccInsert('leads', Object.assign({
      session_id: sessionId,
      origem: origem,
      ultimo_nicho: window.ccGetUltimoNicho()
    }, payload));
  };
})();
