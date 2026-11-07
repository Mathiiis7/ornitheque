// Assemble les captures du constat téléphone en planches de 4 (moins d'images à regarder).
// node outils/verif/_planche-constat.mjs nom1-1 nom2-1 ... -> notes-privees/chantier-telephone/planche-N.png
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const DOSSIER = path.resolve(process.env.DOSSIER || 'notes-privees/chantier-telephone/constat');
const noms = process.argv.slice(2);
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:4 * 390 + 5 * 12, height:844 + 50 } });
for(let i = 0; i < noms.length; i += 4){
  const lot = noms.slice(i, i + 4);
  const html = '<body style="margin:0;background:#333;display:flex;gap:12px;padding:12px;font:16px sans-serif;color:#fff">' +
    lot.map(n => `<div><div style="height:22px">${n}</div><img style="display:block" src="data:image/png;base64,${fs.readFileSync(path.join(DOSSIER, n + '.png')).toString('base64')}"></div>`).join('') + '</body>';
  await p.setContent(html);
  const sortie = `notes-privees/chantier-telephone/${process.env.PREFIXE || 'planche'}-${i / 4 + 1}.png`;
  await p.screenshot({ path:sortie });
  console.log(sortie, lot.join(', '));
}
await nav.close();
