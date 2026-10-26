// Essai ponctuel (2026-10-26), démo locale : en Loire-Atlantique, Récent, même vue (presqu'île de
// Guérande), les grappes sont-elles les mêmes en rareté du pays et en rareté de la zone ?
// Une grappe = l'ensemble de ses points (espèce + position) ; on compare les deux découpages.
// node outils/verif/_essai-grappes-stables.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.evaluate(() => { try{ localStorage.removeItem('mb-ct-rar-zone'); }catch(_){} });
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
const attend = async () => { for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); if(await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang').length && !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'))) break; } await p.waitForTimeout(2500); };
await attend();
const decoupage = () => p.evaluate(() => {
  window.__carte.setView([47.30, -2.35], 11, { animate:false });
  return new Promise(ok => setTimeout(() => {
    const cle = m => (m._sciName || '') + '@' + m.getLatLng().lat.toFixed(4) + ',' + m.getLatLng().lng.toFixed(4);
    const out = [];
    window.__carte.eachLayer(l => { if(l.getAllChildMarkers && l._icon) out.push(l.getAllChildMarkers().map(cle).sort().join('|')); });
    ok(out.sort());
  }, 800));
});
const pays = await decoupage();
await p.evaluate(() => document.querySelector('[data-ct-portee="zone"]').click());
await attend();
const zone = await decoupage();
const communs = pays.filter(g => zone.includes(g)).length;
const taille = g => g.split('|').length;
console.log('grappes visibles : pays', pays.length, JSON.stringify(pays.map(taille)), '/ zone', zone.length, JSON.stringify(zone.map(taille)));
console.log('grappes identiques :', communs, 'sur', Math.max(pays.length, zone.length));
const pts = s => new Set(s.flatMap(g => g.split('|')));
const a = pts(pays), b = pts(zone);
console.log('points : pays', a.size, '/ zone', b.size, '- seulement en pays', [...a].filter(x => !b.has(x)).length, '- seulement en zone', [...b].filter(x => !a.has(x)).length);
await p.evaluate(() => { try{ localStorage.removeItem('mb-ct-rar-zone'); }catch(_){} });
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
