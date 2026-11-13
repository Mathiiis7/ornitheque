// Essai ponctuel (2026-11-13) : la météo de la Carte. Dans le panneau, l'encart replié sous le nom de la zone,
// qui se déplie en trois jours, un jour ouvrant ses heures ; rien pour un pays entier. Dans la bulle d'un
// hotspot, les trois colonnes en pied. node outils/verif/_essai-meteo.mjs [ordi|tel] [dossier des captures]
import { chromium } from 'playwright';
const MODE = process.argv[2] || 'ordi';
const DOS = process.argv[3] || '.';
const tel = MODE === 'tel';
const nav = await chromium.launch();
const ctx = await nav.newContext(tel
  ? { viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2, locale:'fr-FR', serviceWorkers:'block' }
  : { viewport:{ width:1400, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const demandes = []; p.on('request', r => { if(r.url().includes('open-meteo')) demandes.push(r.url()); });
p.on('console', m => { if(m.type() === 'error') erreurs.push('console : ' + m.text()); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const etat = () => p.evaluate(() => {
  const m = document.getElementById('ctMeteo');
  return { zone:document.getElementById('ctZoneNom').textContent, cache:m.hidden, texte:m.innerText.replace(/\s+/g, ' ').slice(0, 160),
    ouvert:m.classList.contains('meteo-ouvert'), pageDeborde:document.documentElement.scrollWidth > innerWidth };
});
console.log('ARRIVÉE', JSON.stringify(await etat()));
// La France entière : pas de météo.
await p.evaluate(() => { const s = document.getElementById('mapEbRegion'); s.value = 'FR'; s.dispatchEvent(new Event('change', { bubbles:true })); });
await p.waitForTimeout(1500);
console.log('PAYS', JSON.stringify(await etat()));
// Une région, puis un département.
await p.evaluate(() => { const s = document.getElementById('mapEbRegion'); s.value = 'FR-PDL'; s.dispatchEvent(new Event('change', { bubbles:true })); });
await p.waitForTimeout(3500);
console.log('RÉGION', JSON.stringify(await etat()));
const depts = await p.evaluate(() => [...document.getElementById('mapEbDept').options].map(o => o.value));
console.log('départements proposés :', depts.join(' '));
const vendee = depts.find(v => /85$/.test(v));
if(vendee){
  await p.evaluate(v => { const s = document.getElementById('mapEbDept'); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, vendee);
  await p.waitForTimeout(3500);
  console.log('DÉPARTEMENT', JSON.stringify(await etat()));
}
await p.evaluate(() => document.getElementById('ctZone').scrollIntoView({ block:'start' })); await p.waitForTimeout(300);
await p.locator('#ctZone').screenshot({ path:`${DOS}/meteo-${MODE}-1-replie.png` });
// Déplier, puis ouvrir « Demain ».
await p.click('#ctMeteo [data-meteo-plier]'); await p.waitForTimeout(300);
console.log('DÉPLIÉ', JSON.stringify(await etat()));
await p.locator('#ctZone').screenshot({ path:`${DOS}/meteo-${MODE}-2-deplie.png` });
await p.click('#ctMeteo [data-meteo-jour="1"]'); await p.waitForTimeout(300);
console.log('DEMAIN', JSON.stringify(await p.evaluate(() => {
  const j = document.querySelector('#ctMeteo .meteo-jour:not([hidden])');
  const ul = j && j.querySelector('.meteo-heures');
  return { jour:j && j.dataset.j, heures:ul ? ul.children.length : 0, premiere:ul && ul.children[0].innerText.replace(/\s+/g, ' '),
    defile:ul ? ul.scrollWidth > ul.clientWidth : null, pageDeborde:document.documentElement.scrollWidth > innerWidth,
    tailles:[...new Set([...document.querySelectorAll('#ctMeteo span, #ctMeteo b, #ctMeteo p, #ctMeteo a')].filter(e => e.offsetWidth && e.textContent.trim() && !e.classList.contains('meteo-ico')).map(e => getComputedStyle(e).fontSize))] };
})));
await p.locator('#ctZone').screenshot({ path:`${DOS}/meteo-${MODE}-3-demain.png` });
// Le panneau reste ouvert d'un geste à l'autre : un nouveau dessin ne referme pas le jour ouvert.
await p.click('#ctOnglets [data-onglet="ligue"]'); await p.waitForTimeout(800);
console.log('APRÈS UN ONGLET, jour encore ouvert :', await p.evaluate(() => !!document.querySelector('#ctMeteo .meteo-jour:not([hidden])')));
// La bulle d'un hotspot : la couche Hotspots, puis le premier carré.
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="hot"], #ctCouches [data-couche="hotspots"]')?.click());
await p.waitForTimeout(8000);
const nbHs = await p.evaluate(() => document.querySelectorAll('.leaflet-marker-icon').length);
console.log('marqueurs sur la carte :', nbHs);
const ouvert = await p.evaluate(() => {
  const ic = [...document.querySelectorAll('.leaflet-marker-icon')].find(e => /hs|hotspot/i.test(e.className));
  if(!ic) return false; ic.dispatchEvent(new MouseEvent('click', { bubbles:true })); return true;
});
await p.waitForTimeout(3000);
if(ouvert){
  console.log('BULLE', JSON.stringify(await p.evaluate(() => { const b = document.querySelector('.leaflet-popup .meteo-bulle'); return b ? b.innerText.replace(/\s+/g, ' ').slice(0, 160) : 'pas d\'encart'; })));
  await p.click('.leaflet-popup .meteo-bulle [data-meteo-jour="0"]').catch(e => console.log('clic jour :', e.message.split('\n')[0]));
  await p.waitForTimeout(1500);
  console.log('BULLE dans la carte :', JSON.stringify(await p.evaluate(() => {
    const b = document.querySelector('.leaflet-popup-content-wrapper').getBoundingClientRect(), c = document.getElementById('mapEl').getBoundingClientRect();
    return { hautBulle:Math.round(b.top), basBulle:Math.round(b.bottom), hautCarte:Math.round(c.top), basCarte:Math.round(c.bottom), hauteurBulle:Math.round(b.height) };
  })));
  console.log('BULLE, aujourd\'hui ouvert :', await p.evaluate(() => { const ul = document.querySelector('.leaflet-popup .meteo-jour:not([hidden]) .meteo-heures'); return ul ? ul.children.length + ' heures' : 'rien'; }),
    'bulle toujours ouverte :', await p.evaluate(() => !!document.querySelector('.leaflet-popup')));
  await p.locator('.leaflet-popup').screenshot({ path:`${DOS}/meteo-${MODE}-4-bulle.png` });
} else console.log('aucun hotspot à ouvrir');
// Plusieurs hotspots, un jour ouvert : la bulle tient-elle dans la carte ?
const nbIcones = await p.evaluate(() => [...document.querySelectorAll('.leaflet-marker-icon')].filter(e => /hs|hotspot/i.test(e.className)).length);
for(let i = 0; i < Math.min(nbIcones, 8); i++){
  await p.evaluate(() => _ferme = document.querySelector('.leaflet-popup-close-button')?.click()).catch(() => {});
  await p.waitForTimeout(400);
  await p.evaluate(i => [...document.querySelectorAll('.leaflet-marker-icon')].filter(e => /hs|hotspot/i.test(e.className))[i]?.dispatchEvent(new MouseEvent('click', { bubbles:true })), i);
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('.leaflet-popup .meteo-bulle [data-meteo-jour="1"]')?.click());
  await p.waitForTimeout(1500);
  console.log('hotspot', i, JSON.stringify(await p.evaluate(() => {
    const w = document.querySelector('.leaflet-popup-content-wrapper'); if(!w) return 'pas de bulle';
    const b = w.getBoundingClientRect(), c = document.getElementById('mapEl').getBoundingClientRect();
    return { hauteur:Math.round(b.height), carte:Math.round(c.height), depasseHaut:Math.round(c.top - b.top), depasseBas:Math.round(b.bottom - c.bottom), meteo:!!w.querySelector('.meteo-cols') };
  })));
}
console.log('demandes Open-Meteo :', demandes.length, demandes.map(u => u.match(/latitude=[^&]+&longitude=[^&]+/)[0]).join(' | '));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
