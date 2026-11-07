// Constat téléphone, deux vérifications (2026-11-07) : l'entête reste-t-il collé en haut quand on descend,
// et quelle place prend-il ? Ma liste défile-t-elle dans une boîte à l'intérieur de la page ?
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, locale:'fr-FR' });
await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'load'); }catch(_){} });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
for(const v of ['ranking', 'pokedex', 'load']){
  await p.evaluate(v => document.querySelector(`.tab[data-view="${v}"]`).click(), v);
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    scrollTo(0, 3000);
    const colles = [...document.querySelectorAll('header, .tabs, .topbar, .app-head, .wrap > *')].filter(e => ['sticky', 'fixed'].includes(getComputedStyle(e).position))
      .map(e => { const b = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}.${e.className} ${getComputedStyle(e).position} haut ${Math.round(b.top)} bas ${Math.round(b.bottom)}`; });
    // Boîtes qui défilent en hauteur à l'intérieur de la page
    const boites = [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 5 && e.getClientRects().length; })
      .map(e => `${e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]} ${e.clientHeight}/${e.scrollHeight}px`);
    return { scrollY, colles, boites };
  });
  console.log(v, JSON.stringify(r));
}
await nav.close();
