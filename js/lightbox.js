/* Lightbox simples: fecha no X, clicando fora ou com ESC */
(function () {
  let box, img, closeBtn, lastFocus = null;

  function open(src, alt) {
    if (!box) return;
    lastFocus = document.activeElement;
    img.src = src;
    img.alt = alt || '';
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-open'));
    document.documentElement.classList.add('no-scroll');
    closeBtn.focus();
  }

  function close() {
    if (!box || box.hidden) return;
    box.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    setTimeout(() => { box.hidden = true; img.removeAttribute('src'); }, 250);
    if (lastFocus) lastFocus.focus();
  }

  function init() {
    box = document.getElementById('lightbox');
    if (!box) return;
    img = box.querySelector('.lightbox-img');
    closeBtn = box.querySelector('.lightbox-close');
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  window.Lightbox = { init, open, close };
})();
