/* =========================================================
   10. Contato + Popup
   Envio IGUAL ao site anterior:
   - Supabase (tabela leads, via ccSubmitLead) com os mesmos campos
   - Formspree https://formspree.io/f/mdaqneqg com os mesmos nomes de campo
   Novo: campo "servico" (vai no Formspree; no Supabase entra no início da mensagem,
   porque a tabela leads não tem essa coluna)
   ========================================================= */
(function () {
  const FORMSPREE = 'https://formspree.io/f/mdaqneqg';
  const K_POPUP = 'leadPopupShown';          // mesma chave do site anterior (1 vez por visita)
  const K_ENVIADO = 'cg_proposta_enviada';   // quem já mandou proposta não vê o popup

  const guardar = (store, k, v) => { try { store.setItem(k, v); } catch (e) { /* ok */ } };
  const ler = (store, k) => { try { return store.getItem(k); } catch (e) { return null; } };

  function enviarFormspree(form) {
    return fetch(FORMSPREE, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then((r) => r.ok)
      .catch(() => false);
  }

  /* ---------------- formulário de contato ---------------- */
  const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validarCampo(input) {
    const erro = input.parentElement.querySelector('.campo-erro');
    let ok = true;
    const v = input.value.trim();
    if (input.required && !v) ok = false;
    if (ok && input.type === 'email' && !EMAIL_OK.test(v)) ok = false;
    if (ok && input.name === 'whatsapp' && v.replace(/\D/g, '').length < 10) ok = false;
    input.setAttribute('aria-invalid', String(!ok));
    input.closest('.campo').classList.toggle('tem-erro', !ok);
    if (erro) erro.textContent = ok ? '' : I18N.t(input.dataset.erro);
    return ok;
  }

  function initContato() {
    const form = document.getElementById('contatoForm');
    if (!form) return;
    const sucesso = document.getElementById('contatoSucesso');
    const falha = document.getElementById('contatoFalha');
    const servico = document.getElementById('campoServico');
    const obrig = [...form.querySelectorAll('[required]')];

    obrig.forEach((i) => {
      i.addEventListener('blur', () => { if (i.value.trim()) validarCampo(i); });
      i.addEventListener('input', () => { if (i.getAttribute('aria-invalid') === 'true') validarCampo(i); });
    });

    // "Quero esse formato" / "Bora conversar" preenchem o serviço
    function marcarServico(valor) {
      if (!valor) return;
      servico.value = valor;
      const c = servico.closest('.campo');
      c.classList.remove('destaque');
      void c.offsetWidth;
      c.classList.add('destaque');
    }
    document.addEventListener('servico:escolher', (e) => marcarServico(e.detail.valor));
    if (window.CG_SERVICO) marcarServico(window.CG_SERVICO);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      falha.hidden = true;
      const validos = obrig.map(validarCampo);
      if (validos.includes(false)) {
        obrig[validos.indexOf(false)].focus();
        return;
      }
      const btn = form.querySelector('.form-enviar');
      btn.disabled = true;
      btn.classList.add('enviando');

      const svc = servico.value;
      const msg = form.mensagem.value;
      const lead = window.ccSubmitLead ? window.ccSubmitLead({
        nome: form.nome.value,
        marca: form.marca.value,
        email: form.email.value,
        whatsapp: form.whatsapp.value,
        orcamento: form.orcamento.value,
        mensagem: svc ? `[Serviço: ${svc}] ${msg}` : msg,
        source: 'contato'
      }) : Promise.resolve(false);

      const [okFormspree, okLead] = await Promise.all([enviarFormspree(form), lead]);
      btn.disabled = false;
      btn.classList.remove('enviando');

      if (!okFormspree && !okLead) { falha.hidden = false; return; }
      guardar(localStorage, K_ENVIADO, '1');
      form.hidden = true;
      sucesso.hidden = false;
      if (window.Sketch) { Sketch.scan(sucesso); sucesso.querySelectorAll('[data-sketch]').forEach((el) => Sketch.replay(el)); }
      sucesso.setAttribute('tabindex', '-1');
      sucesso.focus();
    });
  }

  /* ---------------- popup ---------------- */
  function initPopup() {
    const pop = document.getElementById('leadPopup');
    if (!pop) return;
    const form = document.getElementById('leadPopupForm');
    const corpo = document.getElementById('popupCorpo');
    const ok = document.getElementById('popupSucesso');
    const erro = document.getElementById('popupErro');
    let aberto = false, lastFocus = null, timer = null;

    function podeMostrar() {
      return !ler(sessionStorage, K_POPUP) && !ler(localStorage, K_ENVIADO);
    }
    function abrir() {
      if (aberto || !podeMostrar()) return;
      aberto = true;
      guardar(sessionStorage, K_POPUP, '1');
      lastFocus = document.activeElement;
      pop.hidden = false;
      requestAnimationFrame(() => {
        pop.classList.add('is-open');
        if (window.Sketch) { Sketch.scan(pop); pop.querySelectorAll('.hl-ideias').forEach((el) => setTimeout(() => Sketch.replay(el), 350)); }
      });
      document.documentElement.classList.add('no-scroll');
      setTimeout(() => form.querySelector('input').focus({ preventScroll: true }), 50);
      limpar();
    }
    function fechar() {
      if (!aberto) return;
      aberto = false;
      pop.classList.remove('is-open');
      document.documentElement.classList.remove('no-scroll');
      setTimeout(() => { pop.hidden = true; }, 350);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    window.CGPopup = { abrir, fechar };

    // aparece depois de 20s OU ao rolar 60% da página (o que vier primeiro)
    function aoRolar() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.6) abrir();
    }
    function limpar() { clearTimeout(timer); window.removeEventListener('scroll', aoRolar); }
    if (podeMostrar()) {
      timer = setTimeout(abrir, 20000);
      window.addEventListener('scroll', aoRolar, { passive: true });
    }

    document.getElementById('popupFechar').addEventListener('click', fechar);
    pop.addEventListener('click', (e) => { if (e.target === pop) fechar(); });
    document.addEventListener('keydown', (e) => {
      if (!aberto) return;
      if (e.key === 'Escape') fechar();
      if (e.key === 'Tab') {
        // mantém o foco dentro do popup
        const f = [...pop.querySelectorAll('button, input, textarea')].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });

    // se trocar o idioma com o popup aberto, redesenha o círculo em "ideias"
    document.addEventListener('i18n:change', () => { if (window.Sketch) Sketch.scan(pop); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const faltando = ['nome', 'rede', 'contato'].filter((n) => !form[n].value.trim());
      ['nome', 'rede', 'contato'].forEach((n) => form[n].setAttribute('aria-invalid', String(faltando.includes(n))));
      if (faltando.length) { erro.textContent = I18N.t('popup.erro'); form[faltando[0]].focus(); return; }
      erro.textContent = '';

      const contato = form.contato.value;
      const isEmail = contato.indexOf('@') !== -1;
      const lead = window.ccSubmitLead ? window.ccSubmitLead({
        nome: form.nome.value,
        email: isEmail ? contato : null,
        whatsapp: isEmail ? null : contato,
        marca: form.rede.value,
        mensagem: form.mensagem.value,
        source: 'popup'
      }) : Promise.resolve();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      await Promise.all([enviarFormspree(form), lead]);
      btn.disabled = false;

      corpo.hidden = true;
      ok.hidden = false;
      setTimeout(fechar, 3500);
    });
  }

  function init() {
    initContato();
    initPopup();
  }

  window.Contato = { init };
})();
