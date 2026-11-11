// Les trois etats qui remplacent des body:has() (2026-11-11) marchent-ils encore ? Au telephone, la barre du bas
// disparait quand un champ a le curseur et revient apres ; a l'ordinateur, la fenetre d'emoji se place a droite
// quand le tchat est ouvert, et repart au centre une fois ferme.
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const nav = await chromium.launch();
let ok = true;
const dire = (bon, ...m) => { if(!bon) ok = false; console.log(bon ? 'OK    ' : 'DEFAUT', ...m); };
{
  const ctx = await nav.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(1000);
  const barre = () => p.evaluate(() => getComputedStyle(document.getElementById('barreBas')).display);
  const avant = await barre();
  await p.focus('#pkdxSearch');
  await p.waitForTimeout(200);
  const pendant = await barre();
  await p.evaluate(() => document.activeElement.blur());
  await p.waitForTimeout(200);
  const apres = await barre();
  dire(avant !== 'none' && pendant === 'none' && apres === avant, 'telephone, barre du bas :', avant, '->', pendant, '->', apres);
  await ctx.close();
}
{
  const ctx = await nav.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  const pos = () => p.evaluate(() => { const i = document.querySelector('#emojiPop .emoji-pop-inner'); const s = getComputedStyle(i);
    return { classe: document.documentElement.classList.contains('fab-ouvert'), left: s.left, right: s.right, bottom: s.bottom }; });
  const ferme = await pos();
  const boutons = await p.evaluate(() => [...document.querySelectorAll('#fabStack button')].map(b => b.getAttribute('data-view') || b.id || b.className));
  await p.evaluate(() => document.querySelector('#fabStack button')?.click());
  await p.waitForTimeout(600);
  const ouvert = await pos();
  await p.evaluate(() => document.getElementById('fabBackdrop')?.click());
  await p.waitForTimeout(400);
  const refermee = await pos();
  dire(!ferme.classe && ouvert.classe && ouvert.right === '20px' && ouvert.bottom === '170px' && !refermee.classe && refermee.left === ferme.left,
    'ordinateur, emoji et panneau flottant :', JSON.stringify({ ferme, ouvert, refermee, boutons }));
  await ctx.close();
}
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();
