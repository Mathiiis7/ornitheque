// Diagnostic (2026-11-11) : au telephone et a l'ordinateur, combien de blocs de la grille du Monde le navigateur
// met-il vraiment en page (content-visibility), et combien coute une mise a jour de style a vide.
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const nav = await chromium.launch();
for(const TEL of [false, true]){
  const ctx = await nav.newContext({ serviceWorkers: 'block', ...(TEL ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } }) });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    document.getElementById('pkdxCountry').click();
    await new Promise(r => setTimeout(r, 600));
    document.querySelector('.cp-group-title[data-cont="Monde"]').click();
    document.querySelector('.cp-modal-close')?.click();
  });
  await p.waitForFunction(() => document.getElementById('pkdxGrid').dataset.rempli === '1', null, { timeout: 120000 });
  await p.waitForTimeout(1000);
  const mesure = () => p.evaluate(() => { const g = document.getElementById('pkdxGrid'); const t0 = performance.now(); for(let i = 0; i < 20; i++){ const d = document.createElement('div'); g.appendChild(d); void d.offsetHeight; d.remove(); } return +((performance.now() - t0) / 20).toFixed(2); });
  const retirer = (motif) => p.evaluate((motif) => { const out = []; const tous = (liste) => { for(let i = liste.length - 1; i >= 0; i--){ const r = liste[i]; if(r.cssRules && !r.selectorText) tous(r.cssRules); if(r.selectorText && r.selectorText.includes(motif)){ out.push(r.selectorText.slice(0, 60)); (r.parentRule || r.parentStyleSheet).deleteRule(i); } } }; for(const s of document.styleSheets){ try{ tous(s.cssRules); }catch(_){} } return out.length; }, motif);
  console.log('  style a vide', await mesure(), 'ms');
  console.log('  sans barre-bas :has', await retirer('focus) .barre-bas'), 'regle(s) ->', await mesure(), 'ms');
  console.log('  sans body:has', await retirer('body:has('), 'regle(s) ->', await mesure(), 'ms');
  console.log('  sans aucun :has', await retirer(':has('), 'regle(s) ->', await mesure(), 'ms');
  const r = await p.evaluate(async () => {
    const g = document.getElementById('pkdxGrid');
    const tr = [...g.querySelectorAll('.pkdx-tranche')];
    // Un bloc mis en page a des cases avec une hauteur ; un bloc saute, la hauteur reservee seulement.
    const etat = new Map();
    tr.forEach(t => t.addEventListener('contentvisibilityautostatechange', e => etat.set(t, e.skipped)));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const sautes = tr.filter(t => etat.get(t) === true).length;
    // Le cout d'une mise a jour de style forcee apres l'ajout d'un element vide.
    const t0 = performance.now();
    for(let i = 0; i < 20; i++){ const d = document.createElement('div'); g.appendChild(d); void d.offsetHeight; d.remove(); }
    const style = (performance.now() - t0) / 20;
    return { blocs: tr.length, sautes, connus: etat.size, styleMs: +style.toFixed(2), scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
      defile: getComputedStyle(document.scrollingElement).overflowY, html: document.documentElement.className.slice(0, 80) };
  });
  console.log(TEL ? 'tel ' : 'ordi', JSON.stringify(r));
  await ctx.close();
}
await nav.close();
