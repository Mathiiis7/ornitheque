// Essai ponctuel (2026-10-29), démo locale : la rareté se mesure sur le pays par défaut, « Zone » ne vaut
// que pour la zone où on l'a choisi, et rien n'est retenu d'une visite à l'autre.
import { chromium } from 'playwright';
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1300, height:900 } });
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.addInitScript(() => { try{ localStorage.setItem('mb-ct-rar-zone', '1'); }catch(_){} });   // l'ancien réglage retenu
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1500); };
const portee = () => p.evaluate(() => [...document.querySelectorAll('#ctPortee [data-ct-portee], #ctPorteeLigue [data-ct-portee]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')).join(' '));
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(500);
await regle('mapEbRegion', 'FR-GES');
console.log('Grand Est, ancien réglage « zone » dans le navigateur :', await portee());
await p.evaluate(() => document.querySelector('#ctPortee [data-ct-portee="zone"]').click()); await p.waitForTimeout(800);
console.log('« Zone » choisi :', await portee());
await regle('mapEbRegion', 'FR-BFC');
console.log('autre région (« Zone » doit rester) :', await portee());
// Revenir sur le site : la mesure repart du pays (le réglage n'est plus retenu dans le navigateur).
await p.reload({ waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(500);
await regle('mapEbRegion', 'FR-GES');
console.log('après rechargement (pays attendu) :', await portee());
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
