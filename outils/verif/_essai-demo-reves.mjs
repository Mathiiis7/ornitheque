// Essai (2026-10-30), démo locale : chaque espèce de rêve du Classement a son image. node outils/verif/_essai-demo-reves.mjs CAPTURE
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:700 }, locale:'fr-FR', serviceWorkers:'block' });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="ranking"]').click());
await p.waitForTimeout(3500);
const l = await p.evaluate(() => [...document.querySelectorAll('tbody tr')].map(tr => tr.querySelector('td.c-esp:last-child')).filter(Boolean).map(td => ({ texte:td.textContent.trim().replace(/\s+/g, ' '), image:td.querySelectorAll('[data-sci], img').length })));
console.log(JSON.stringify(l));
console.log(l.length === 5 && l.every(x => x.image) ? 'CONFORME' : 'DÉFAUT');
await p.screenshot({ path:process.argv[2] });
await nav.close();
