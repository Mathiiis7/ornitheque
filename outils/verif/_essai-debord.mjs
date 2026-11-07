// Chantier téléphone : qui dépasse à droite sur une page (390 px, doigt) ? Et le guide s'ouvre-t-il ?
// node outils/verif/_essai-debord.mjs ranking
import { chromium } from 'playwright';
const vue = process.argv[2] || 'ranking';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, locale:'fr-FR' });
await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'load'); }catch(_){} });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
for(let i = 0; i < 10; i++){
  await p.waitForTimeout(1000);
  const g = await p.evaluate(() => ({ cache:document.getElementById('guide').hidden, titre:document.getElementById('guideTitre').textContent }));
  console.log(`t=${i + 1}s guide`, g.cache ? 'caché' : 'ouvert « ' + g.titre + ' »');
}
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(v => document.querySelector(`.tab[data-view="${v}"]`).click(), vue);
await p.waitForTimeout(2000);
const r = await p.evaluate(() => {
  const W = innerWidth, out = [];
  for(const el of document.querySelectorAll('body *')){
    if(!el.getClientRects().length) continue;
    const b = el.getBoundingClientRect();
    if(b.right > W + 1 && ![...el.children].some(c => c.getBoundingClientRect().right > W + 1)){
      let a = el, chemin = []; for(let i = 0; i < 4 && a; i++, a = a.parentElement) chemin.push(a.id ? '#' + a.id : a.tagName.toLowerCase() + '.' + String(a.className).split(' ')[0]);
      out.push(`${Math.round(b.left)}..${Math.round(b.right)} ${chemin.join(' < ')}`);
    }
  }
  return { largeur:document.documentElement.scrollWidth, out:out.slice(0, 12) };
});
console.log(r.largeur, '\n' + r.out.join('\n'));
await nav.close();
