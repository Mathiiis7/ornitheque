// Essai ponctuel (2026-10-26), démo locale : en Corse-du-Sud, Récent, toutes les espèces.
// 1. La Paruline tigrée (absente des listes eBird de France) a-t-elle un palier, et pas un « ? » gris ?
// 2. La liste d'une grappe ouverte suit-elle le passage de la rareté du pays à la zone, sans reclic ?
// node outils/verif/_essai-grappe-portee.mjs [dossier des captures] [largeur]
import { chromium } from 'playwright';
const DOS = process.argv[2] || '.';
const largeur = +(process.argv[3] || 1440), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message)); p.on('console', m => { if(m.type() === 'error') erreurs.push(m.text()); if(m.text().startsWith('DBG')) console.log(m.text()); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.evaluate(() => { try{ localStorage.removeItem('mb-ct-rar-zone'); }catch(_){} });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2000);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.waitForTimeout(800);
const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1500); };
await regle('mapEbRegion', 'FR-COR');
await regle('mapEbDept', 'FR-COR-2A');
await p.evaluate(() => { const c = document.getElementById('ctRecManque'); if(c && c.checked) c.click(); });
const attend = async () => { for(let i = 0; i < 60; i++){ const ok = await p.evaluate(() => !!document.querySelector('#ctListeRecent .ct-rang')); if(ok) break; await p.waitForTimeout(1000); } await p.waitForTimeout(2000); };
await attend();
// 1. Les espèces au palier « ? » (gris), et la Paruline tigrée.
const sansPalier = await p.evaluate(() => [...document.querySelectorAll('#ctListeRecent .ct-rang')].map(r => {
  const c = r.querySelector('.tier-rond'); return { w:c?.textContent.trim(), nom:r.querySelector('.nom')?.textContent, sci:r.dataset.sci };
}).filter(e => e.w === '?' || /tigrina/i.test(e.sci || '')));
console.log('palier « ? » ou Paruline tigrée :', JSON.stringify(sansPalier));
// 2. La plus grosse grappe visible du Récent : on la clique pour de vrai.
const lireBulle = () => p.evaluate(() => [...document.querySelectorAll('.ct-gl .ct-gl-l')].map(b => b.querySelector('.tier-rond')?.textContent.trim() + ' ' + b.querySelector('.ct-gl-nom')?.textContent));
const cible = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.ct-gr-ico')].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.top > 60 && b.left > 10 && b.bottom < innerHeight - 10 && b.right < innerWidth - 10; });
  els.sort((a, b) => +b.textContent - +a.textContent);
  const e = els[0]; if(!e) return null; const b = e.getBoundingClientRect(); return { x:b.left + b.width / 2, y:b.top + b.height / 2, n:e.textContent };
});
if(!cible){ console.log('aucune grappe visible'); await nav.close(); process.exit(0); }
await p.mouse.click(cible.x, cible.y);
await p.waitForTimeout(800);
const avant = await lireBulle();
console.log('grappe de', cible.n, 'espèces, rareté du pays :', avant.length, 'lignes', JSON.stringify(avant.slice(0, 8)));
await p.screenshot({ path:`${DOS}/grappe-pays-${largeur}.png` });
await p.evaluate(() => document.querySelector('[data-ct-portee="zone"]').click());
for(let i = 0; i < 30; i++){ await p.waitForTimeout(1000); if(JSON.stringify(await lireBulle()) !== JSON.stringify(avant)) break; }
await p.waitForTimeout(1000);
const tout_de_suite = await lireBulle();
console.log('juste après le clic :', tout_de_suite.length, 'lignes', JSON.stringify(tout_de_suite.slice(0, 8)));
// Puis une fois les points reposés (listes relues).
for(let i = 0; i < 30; i++){ await p.waitForTimeout(1000); if(await p.evaluate(() => !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'))) break; }
await p.waitForTimeout(2000);
const apres = await lireBulle();
console.log('même grappe, rareté de la zone :', apres.length, 'lignes', JSON.stringify(apres.slice(0, 8)));
console.log('bulle ouverte :', await p.evaluate(() => !!document.querySelector('.ct-gl')), '- a changé :', JSON.stringify(avant) !== JSON.stringify(apres));
await p.screenshot({ path:`${DOS}/grappe-zone-${largeur}.png` });
await p.evaluate(() => { try{ localStorage.removeItem('mb-ct-rar-zone'); }catch(_){} });
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
