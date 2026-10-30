// Essai (2026-10-30), démo locale : passer la scène d'une nouvelle espèce ne doit pas priver de celle du trophée.
// Trois chemins : espèce à découvrir au Birdydex puis onglet Trophées ; ajout depuis une fiche.
// node outils/verif/_essai-espece-puis-trophee.mjs [DOSSIER]
import { chromium } from 'playwright';
const DOS = process.argv[2];
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:850 }, locale:'fr-FR', serviceWorkers:'block' });
const p = await ctx.newPage();
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
let defauts = 0;
const verifie = (ok, txt) => { console.log((ok ? 'ok    ' : 'DÉFAUT') + ' ' + txt); if(!ok) defauts++; };
const pret = async () => { await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(13500); };
const etat = () => p.evaluate(() => {
  const k = Object.keys(localStorage).find(k => k.startsWith('mb-trophees-'));
  return { attente:JSON.parse(localStorage.getItem(k)).attente, troScene:!!document.getElementById('troDialog')?.open, espScene:!!document.getElementById('debloqueDialog')?.open,
    fiche:!document.getElementById('speciesModal')?.hidden, ouverts:[...document.querySelectorAll('dialog[open]')].map(d => d.id), vue:document.querySelector('.tab.on')?.dataset.view };
});
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await pret();
// Un trophée en attente, et une espèce de la liste à découvrir.
await p.evaluate(() => {
  const k = Object.keys(localStorage).find(k => k.startsWith('mb-trophees-')), uid = k.replace('mb-trophees-', ''), e = JSON.parse(localStorage.getItem(k));
  e.vus = e.vus.filter(n => n !== 'Rapaces diurnes Or'); localStorage.setItem(k, JSON.stringify(e));
  localStorage.setItem('mb-a-decouvrir-' + uid, JSON.stringify(['turdus merula']));
});
await p.reload({ waitUntil:'load' });
await pret();
console.log('départ', JSON.stringify(await etat()));
await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]').click());
await p.waitForTimeout(2500);
const nb = await p.locator('#pkdxGrid .pkdx-card.a-decouvrir').count();
verifie(nb > 0, nb + ' case(s) à découvrir');
await p.locator('#pkdxGrid .pkdx-card.a-decouvrir').first().click();
await p.waitForTimeout(800);
console.log('scène espèce', JSON.stringify(await etat()));
await p.mouse.click(30, 400);          // passer
await p.waitForTimeout(300);
await p.locator('#debloqueScene [data-ferme]').click();
await p.waitForTimeout(500);
console.log('après Continuer', JSON.stringify(await etat()));
await p.evaluate(() => document.querySelector('.tab[data-view="trophies"]').click());
await p.waitForTimeout(1200);
const fin = await etat();
console.log('sur Trophées', JSON.stringify(fin));
verifie(fin.troScene, 'la scène du trophée démarre');
if(DOS) await p.screenshot({ path:DOS + '/espece-puis-trophee.png' });
verifie(!erreurs.length, 'erreurs : ' + erreurs.slice(0, 3).join(' / '));
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
