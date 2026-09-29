/* =========================================================
   2. Marcas: faixa infinita montada a partir de logos/lista.json
   (a lista é gerada sozinha pelo script scripts/gerar-listas.js)
   ========================================================= */
(function () {
  async function init() {
    const track = document.getElementById('logosTrack');
    if (!track) return;
    let lista = [];
    try {
      lista = await (await fetch('logos/lista.json', { cache: 'no-cache' })).json();
    } catch (e) { return; }

    const ul = document.createElement('ul');
    ul.className = 'marquee-list';
    lista.forEach((logo) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = 'logos/' + logo.arquivo;
      img.alt = logo.nome;
      img.decoding = 'async';
      li.appendChild(img);
      ul.appendChild(li);
    });
    // duas cópias iguais: anima de 0 a -50% e recomeça sem "pulo"
    const copia = ul.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    copia.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    track.append(ul, copia);
  }

  window.Marcas = { init };
})();
