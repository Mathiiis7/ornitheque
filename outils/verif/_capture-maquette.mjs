// Capture pleine page d'une maquette locale, et liste ce qui déborde de son cadre ou se coupe.
// node outils/verif/_capture-maquette.mjs <url> <fichier.png> [largeur]
import { chromium } from 'playwright';
const [url, sortie, l] = process.argv.slice(2), largeur = +(l || 1280);
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:largeur, height:900 } });
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto(url, { waitUntil:'load' }); await p.waitForTimeout(400);
const defauts = await p.evaluate(() => {
  const out = [];
  for(const e of document.querySelectorAll('.pan *')){
    const r = e.getBoundingClientRect(), c = (e.closest('.bloc') || e.closest('.pan')).getBoundingClientRect();
    if(r.width && (r.right > c.right + 0.5)) out.push('déborde : ' + (e.className || e.tagName) + ' ' + e.textContent.trim().slice(0, 20));
    if(e.offsetWidth && e.children.length === 0 && e.scrollWidth > e.clientWidth + 1) out.push('coupé : ' + e.textContent.trim());
  }
  return [...new Set(out)].slice(0, 15);
});
await p.screenshot({ path:sortie, fullPage:true });
console.log(JSON.stringify({ largeur, defauts, erreurs }));
await nav.close();
