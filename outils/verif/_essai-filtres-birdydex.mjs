// Essai ponctuel (2026-10-29), démo locale : les filtres du Birdydex dans le bloc gris (version B).
// Captures fermé / ouvert, débordements, tailles, et chaque commande essayée.
// node outils/verif/_essai-filtres-birdydex.mjs [largeur]   (SOMBRE=1 pour le mode sombre)
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/114db7bd-8fd3-4659-8df7-c4a94d9f07db/scratchpad';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 950 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', colorScheme:process.env.SOMBRE ? 'dark' : 'light' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto(process.env.BASE || 'http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => { try{ localStorage.removeItem('mb-pkdx-filtres-ouverts'); }catch(_){} document.querySelector('.tab[data-view="pokedex"]').click(); });
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const clic = async sel => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(500); };
const lis = () => p.evaluate(() => ({
  ouvert:!document.getElementById('pkdxFiltres').hidden, cases:document.querySelectorAll('#pkdxGrid .pkdx-card, #pkdxGrid [data-sci]').length,
  compteur:document.getElementById('pkdxCounter').textContent.trim(),
  tri:[...document.querySelectorAll('[data-pkdx-sort].on')].map(b => b.textContent).join(), vue:[...document.querySelectorAll('[data-pkdx-owned].on')].map(b => b.textContent).join(),
  paliersOn:document.querySelectorAll('#pkdxTierChips .rar-chip[data-tier].on').length, catsOn:document.querySelectorAll('#pkdxTierChips .rar-chip[data-cat].on').length,
}));
const mesure = () => p.evaluate(() => {
  const bloc = document.getElementById('pkdxFiltres'), b = bloc.getBoundingClientRect();
  const deborde = [...bloc.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > b.right + 0.5 || r.left < b.left - 0.5); }).map(e => e.id || e.className || e.tagName);
  const coupe = [...bloc.querySelectorAll('button, .cp-btn-label, .ct-k')].filter(e => e.offsetWidth && e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim());
  const cmd = [...new Set([...bloc.querySelectorAll('.seg button, .cp-btn')].filter(e => e.offsetWidth).map(e => Math.round(e.getBoundingClientRect().height)))];
  const lignes = [...bloc.querySelectorAll('.ct-ligne')].map(l => { const r = l.getBoundingClientRect(); return l.querySelector('.ct-k').textContent + '@' + Math.round(r.left - b.left) + ',' + Math.round(r.top - b.top); });
  const petits = [...bloc.querySelectorAll('*')].filter(e => e.offsetWidth && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !e.closest('.rar-chips'))
    .map(e => parseFloat(getComputedStyle(e).fontSize)).sort((a, c) => a - c)[0];
  return { lignes, deborde, coupe, hauteursCommandes:cmd, plusPetitTexteCSS:petits, pageDeborde:document.documentElement.scrollWidth > innerWidth, doigt:matchMedia('(pointer: coarse)').matches };
});
console.log('fermé', JSON.stringify(await lis()));
await p.locator('#viewPokedex section.panel').screenshot({ path:`${DOS}/bdx-ferme-${largeur}.png`, clip:undefined }).catch(() => {});
await clic('#pkdxPliBtn');
console.log('ouvert', JSON.stringify(await lis()), JSON.stringify(await mesure()));
await p.evaluate(() => document.getElementById('pkdxFiltres').scrollIntoView({ block:'center' }));
await p.waitForTimeout(300);
await p.screenshot({ path:`${DOS}/bdx-ouvert-${largeur}.png` });
await clic('[data-pkdx-owned="owned"]'); console.log('  vues', JSON.stringify(await lis()));
await clic('[data-pkdx-owned="missing"]'); console.log('  manquantes', JSON.stringify(await lis()));
await clic('[data-pkdx-owned=""]');
await clic('[data-pkdx-sort="rarete"]'); console.log('  tri rareté', JSON.stringify(await lis()));
await clic('[data-pkdx-sort="famille"]');
await clic('#pkdxTierChips [data-tier-none]'); console.log('  aucun', JSON.stringify(await lis()));
await clic('#pkdxTierChips [data-tier-all]'); console.log('  tout', JSON.stringify(await lis()));
await clic('#pkdxTierChips [data-cat="N"]'); console.log('  N', JSON.stringify(await lis()));
await clic('#pkdxTierChips [data-cat="N"]');
await clic('#pkdxFamily'); await p.waitForTimeout(500);
console.log('  fenêtre famille', await p.evaluate(() => !!document.querySelector('.cp-modal-backdrop')));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await clic('#pkdxHabitat'); await p.waitForTimeout(500);
console.log('  fenêtre milieu', await p.evaluate(() => !!document.querySelector('.cp-modal-backdrop')));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await clic('#pkdxCountry'); await p.waitForTimeout(500);
console.log('  fenêtre pays', await p.evaluate(() => !!document.querySelector('.cp-modal-backdrop')));
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.reload({ waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]').click()); await p.waitForTimeout(1500);
console.log('après rechargement, resté ouvert :', await p.evaluate(() => !document.getElementById('pkdxFiltres').hidden));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
