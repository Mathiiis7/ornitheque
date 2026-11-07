// Chantier téléphone, étape 3b (2026-11-08) : de quoi sont faites les pages à reprendre, à 390 px ?
// Imprime, pour chaque bloc visé, ses classes, sa taille et celles de ses premiers enfants.
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, locale:'fr-FR' });
await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'load'); }catch(_){} });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(3000);
const VISES = {
  load:['.ml-boxes', '.ml-box', '#myListBody', '.mylist-row'],
  ranking:['table.board-sheet', '.board-sheet thead th', '.board-sheet tbody tr', '#matrixCards', '#matrixCards > *', '.board-sp', '#matrix'],
  pokedex:['#pkdxGrid', '.pkdx-groupe', '.pkdx-card', '.pkdx-card > *'],
  trophies:['#trophyGrid, .tro-grid', '.tro-card, .trophy-card', '.tro-card > *, .trophy-card > *'],
  map:['#ctCouches', '.ct-couche'],
  chat:['#viewChat .panel', '#chatMessages', '.chat-form, #chatForm, .chat-input', '#chatText'],
};
for(const [v, sels] of Object.entries(VISES)){
  await p.evaluate(v => document.querySelector(`.tab[data-view="${v}"]`).click(), v);
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const d = document.getElementById('ctChoixDialog'); if(d?.open) d.close(); });
  console.log('\n== ' + v);
  for(const s of sels){
    const r = await p.evaluate(s => {
      const els = [...document.querySelectorAll(s)].filter(e => e.getClientRects().length);
      if(!els.length) return 'introuvable';
      const e = els[0], b = e.getBoundingClientRect(), st = getComputedStyle(e);
      const enf = [...e.children].slice(0, 6).map(c => c.tagName.toLowerCase() + (c.className && typeof c.className === 'string' ? '.' + c.className.trim().split(/\s+/).join('.') : ''));
      return `${els.length}× ${e.tagName.toLowerCase()}.${String(e.className).trim().split(/\s+/).join('.')} ${Math.round(b.width)}x${Math.round(b.height)} display:${st.display} ${st.gridTemplateColumns !== 'none' ? 'cols:' + st.gridTemplateColumns : ''} | enfants: ${enf.join(', ')}`;
    }, s);
    console.log('  ' + s + ' -> ' + r);
  }
}
await nav.close();
