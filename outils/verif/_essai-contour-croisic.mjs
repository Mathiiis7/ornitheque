// Essai ponctuel (2026-10-26), démo locale : capture du contour de la Loire-Atlantique autour du Croisic,
// avec les points du Récent, pour juger un contour plus ou moins fin. node outils/verif/_essai-contour-croisic.mjs nom
import { chromium } from 'playwright';
const nom = process.argv[2] || 'essai';
const DOS = 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(800);
const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1500); };
await regle('mapEbRegion', 'FR-PDL'); await regle('mapEbDept', 'FR-PDL-44');
for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); if(await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang').length && !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'))) break; }
await p.evaluate(() => { window.__carte.setView([47.29, -2.50], 13, { animate:false }); });
await p.waitForTimeout(2500);
await p.screenshot({ path:`${DOS}/croisic-${nom}.png`, clip:{ x:96, y:174, width:888, height:542 } });
console.log('capture', `${DOS}/croisic-${nom}.png`);
await nav.close();
