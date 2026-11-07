// 2026-11-08 : les filtres de « Qui a vu quoi » au téléphone (390 px, doigt). Capture de la rangée, puis de
// chaque menu ouvert ; mesure des ronds de rareté et des jetons X / P / N, et des retours à la ligne.
// node outils/verif/_essai-filtres-qui.mjs -> notes-privees/chantier-telephone/pages-ok/qui-filtres-*.png
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, locale:'fr-FR' });
await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'ranking'); }catch(_){} });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(3500);
// Les filtres de rareté n'existent qu'en mode rareté : Rareté terrain, puis on referme son barème.
if(process.env.MODE){ await p.locator('#boardModes button', { hasText:process.env.MODE }).tap(); await p.waitForTimeout(800); await p.mouse.click(5, 600); await p.waitForTimeout(400); }
const haut = () => p.evaluate(() => { const c = document.querySelector('#matrix .controls'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 130); });
await haut(); await p.waitForTimeout(400);
await p.screenshot({ path:`notes-privees/chantier-telephone/pages-ok/qui-filtres-${process.env.MODE ? 'r' : ''}0.png` });
const boutons = await p.evaluate(() => [...document.querySelectorAll('#matrix .controls button, #matrix .fm-barre button')].filter(b => b.getClientRects().length)
  .map(b => b.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)));
console.log('boutons :', boutons.join(' | '));
let i = 1;
for(const nom of boutons){
  await haut();
  await p.locator('#matrix button', { hasText:nom }).first().tap().catch(() => {});
  await p.waitForTimeout(600);
  const m = await p.evaluate(() => {
    const ronds = [...document.querySelectorAll('#tierChips .rar-chip[data-rar]')].filter(x => x.getClientRects().length).map(x => Math.round(x.getBoundingClientRect().width));
    const cats = [...document.querySelectorAll('#tierChips .rar-chip[data-cat]')].filter(x => x.getClientRects().length).map(x => Math.round(x.getBoundingClientRect().width));
    const lignes = new Set([...document.querySelectorAll('#tierChips .rar-chip')].filter(x => x.getClientRects().length).map(x => Math.round(x.getBoundingClientRect().top))).size;
    return { ronds:ronds.slice(0, 3), cats, lignes };
  });
  if(m.ronds.length || m.cats.length) console.log(`  « ${nom} » : ronds ${m.ronds.join(',')} px, X/P/N ${m.cats.join(',')} px, ${m.lignes} ligne(s)`);
  await p.screenshot({ path:`notes-privees/chantier-telephone/pages-ok/qui-filtres-${i++}.png` });
  await p.mouse.click(5, 300).catch(() => {});
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
}
await nav.close();
