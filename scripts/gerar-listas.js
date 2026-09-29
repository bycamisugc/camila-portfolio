/* =========================================================
   Gera logos/lista.json a partir dos arquivos da pasta de logos.
   Roda sozinho no GitHub (Action "Atualizar listas") a cada envio,
   ou manualmente:  node scripts/gerar-listas.js
   - arquivos novos entram na lista com o nome tirado do arquivo
   - nomes já editados à mão na lista são mantidos
   - arquivos apagados saem da lista
   ========================================================= */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
// pasta do site novo enquanto estiver em "novo/"; depois de publicado vale a raiz
const PASTAS = ['novo/logos', 'logos'].map((p) => path.join(RAIZ, p)).filter((p) => fs.existsSync(p));
const EXT = /\.(png|webp|svg)$/i;

const nomeBonito = (arquivo) => arquivo
  .replace(EXT, '')
  .split(/[-_ ]+/)
  .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
  .join(' ');

for (const pasta of PASTAS) {
  const destino = path.join(pasta, 'lista.json');
  let antiga = [];
  try { antiga = JSON.parse(fs.readFileSync(destino, 'utf8')); } catch (e) { /* primeira vez */ }
  const nomes = Object.fromEntries(antiga.map((l) => [l.arquivo, l.nome]));

  const lista = fs.readdirSync(pasta)
    .filter((f) => EXT.test(f))
    .sort((a, b) => a.localeCompare(b))
    .map((arquivo) => ({ arquivo, nome: nomes[arquivo] || nomeBonito(arquivo) }));

  fs.writeFileSync(destino, JSON.stringify(lista, null, 2) + '\n');
  console.log(`${path.relative(RAIZ, destino)}: ${lista.length} logos`);
}
