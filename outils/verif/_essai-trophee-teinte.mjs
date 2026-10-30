// Essai (2026-10-30), démo locale : le fond de la scène garde la couleur de l'ancien palier jusqu'au flash,
// puis prend celle du nouveau. Rapaces diurnes : Argent #9ab8d0 -> Or #e6c235.
// node outils/verif/_essai-trophee-teinte.mjs DOSSIER
import { chromium } from 'playwright';
const DOS = process.argv[2];
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:850 }, locale:'fr-FR', serviceWorkers:'block' });
const p = await ctx.newPage();
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
const pret = async () => { await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(13500); };
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await pret();
await p.evaluate(() => { const k = Object.keys(localStorage).find(k => k.startsWith('mb-trophees-')), e = JSON.parse(localStorage.getItem(k)); e.vus = e.vus.filter(n => n !== 'Rapaces diurnes Or'); localStorage.setItem(k, JSON.stringify(e)); });
await p.reload({ waitUntil:'load' });
await pret();
await p.evaluate(() => document.querySelector('.tab[data-view="trophies"]').click());
await p.waitForSelector('.tro-sc');
const t0 = Date.now();
const teinte = () => p.evaluate(() => { const s = getComputedStyle(document.querySelector('.tro-sc')); return { teinte:s.getPropertyValue('--tro-teinte').trim(), fond:getComputedStyle(document.querySelector('.tro-sc-jauge-plein')).backgroundColor }; });
const a = async ms => { await p.waitForTimeout(Math.max(0, ms - (Date.now() - t0))); };
await a(1500); const avant = await teinte(); await p.screenshot({ path:`${DOS}/teinte-1-avant.png` });
await a(5000); const apres = await teinte(); await p.screenshot({ path:`${DOS}/teinte-2-apres.png` });
console.log('avant', JSON.stringify(avant), '\napres', JSON.stringify(apres));
const est = (v, r, g, b) => { const m = v.match(/[\d.]+/g).map(Number); const x = m.length >= 4 && v.includes('srgb') ? m.slice(0, 3).map(c => c * 255) : m.slice(0, 3); return Math.abs(x[0] - r) + Math.abs(x[1] - g) + Math.abs(x[2] - b) < 6; };
const ok = est(avant.fond, 0x9a, 0xb8, 0xd0) && est(apres.fond, 0xe6, 0xc2, 0x35) && !erreurs.length;
console.log('erreurs', erreurs.length, ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();
