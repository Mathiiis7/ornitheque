// Essai ponctuel (2026-10-26), démo locale : le panneau du Récent avec ses réglages repliés sous
// « Filtres ». Captures pli fermé et ouvert, résumé, ce qui reste visible, la bulle de la note.
// node outils/verif/_essai-pli-filtres.mjs [largeur]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1440), mobile = largeur < 700;
const DOS = 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto(process.env.BASE || 'http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.waitForTimeout(800);
const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1500); };
await regle('mapEbRegion', 'FR-PDL');
await regle('mapEbDept', 'FR-PDL-44');
for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); if(await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang').length && !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'))) break; }
await p.waitForTimeout(1500);
const etat = () => p.evaluate(() => {
  const vis = s => { const e = document.querySelector(s); if(!e) return 'absent'; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? 'visible' : 'caché'; };
  const zone = document.getElementById('ctZone'), z = zone.getBoundingClientRect();
  const premier = document.querySelector('#ctListeRecent .ct-rang')?.getBoundingClientRect();
  const btn = document.querySelector('.ct-pli-btn').getBoundingClientRect();
  return { resume:document.getElementById('ctPliResume').textContent, ouvert:document.getElementById('ctPliRecent').open,
    source:vis('#mapEbSourceLbl'), menusZone:vis('#ctMenusZone'), periode:vis('#ctJours'), rarete:vis('#mapEbRarityChips'), manque:vis('#ctRecManqueLbl'),
    note:document.querySelector('#ctListeRecent .ct-note')?.textContent, bulle:document.querySelector('#ctListeRecent .ct-note')?.dataset.tip,
    premiereEspeceA:premier ? Math.round(premier.top - z.top) + ' px du haut du panneau' : '-', boutonHaut:Math.round(btn.height) + ' px écran',
    debordeDeCote:document.documentElement.scrollWidth > innerWidth };
});
console.log('fermé :', JSON.stringify(await etat()));
await p.evaluate(() => document.getElementById('ctPliRecent').scrollIntoView({ block:'start' }));
await p.screenshot({ path:`${DOS}/pli-ferme-${largeur}.png` });
await p.evaluate(() => document.querySelector('.ct-pli-tete').click());
await p.waitForTimeout(400);
// Un palier décoché : le résumé suit-il ?
await p.evaluate(() => document.querySelector('#mapEbRarityChips [data-rar="1"]').click());
await p.waitForTimeout(2500);
console.log('ouvert, palier 1 décoché :', JSON.stringify(await etat()));
await p.evaluate(() => document.getElementById('ctPliRecent').scrollIntoView({ block:'start' }));
await p.screenshot({ path:`${DOS}/pli-ouvert-${largeur}.png` });
await p.evaluate(() => document.querySelector('#mapEbRarityChips [data-rar="1"]').click());
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
