// Essai (2026-10-30), démo locale : une espèce ajoutée à la main débloque un trophée ; on passe sa scène.
// Le trophée doit se jouer, qu'on soit déjà sur la page Trophées ou qu'on y arrive ensuite.
// node outils/verif/_essai-ajout-puis-trophee.mjs [CAS] [ATTENTE_MS]   CAS = birdydex | trophees | tous (défaut) ;
// ATTENTE_MS : temps passé dans la scène de l'espèce avant de la passer (la détection tombe 2 s après l'ajout).
import { chromium } from 'playwright';
const CAS = process.argv[2] || 'tous', ATTENTE = +process.argv[3] || 0;
const nav = await chromium.launch();
let defauts = 0;
const verifie = (ok, txt) => { console.log((ok ? 'ok    ' : 'DÉFAUT') + ' ' + txt); if(!ok) defauts++; };

async function parcours(cas){
  console.log('--- ' + cas);
  const ctx = await nav.newContext({ viewport:{ width:1300, height:850 }, locale:'fr-FR', serviceWorkers:'block' });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  const etat = () => p.evaluate(() => {
    const k = Object.keys(localStorage).find(k => k.startsWith('mb-trophees-'));
    return { attente:k ? JSON.parse(localStorage.getItem(k)).attente : null, tro:!!document.getElementById('troDialog')?.open, ouverts:[...document.querySelectorAll('dialog[open]')].map(d => d.id), fiche:!document.getElementById('speciesModal')?.hidden, vue:document.querySelector('.tab.on')?.dataset.view };
  });
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(13500);
  // La fiche du Jaseur boréal, depuis la case du Birdydex.
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]').click());
  await p.waitForTimeout(2500);
  const carte = p.locator('#pkdxGrid .pkdx-card[data-sci="bombycilla garrulus"]').first();
  if(!await carte.count()){ console.log('case du Jaseur absente'); defauts++; await ctx.close(); return; }
  await carte.scrollIntoViewIfNeeded();
  await carte.click();
  await p.waitForTimeout(800);
  if(cas === 'trophees'){
    // La fiche reste ouverte et la page dessous devient Trophées : le cas « déjà sur la page ».
    await p.evaluate(() => document.querySelector('.tab[data-view="trophies"]').click());
    await p.waitForTimeout(400);
  }
  console.log('fiche', JSON.stringify(await etat()));
  await p.locator('#smVuBtn').click();
  await p.waitForTimeout(400);
  await p.locator('#manualAddBtn').click();
  await p.waitForTimeout(900);
  console.log('scène espèce', JSON.stringify(await etat()));
  await p.waitForTimeout(ATTENTE);
  console.log('avant de passer', JSON.stringify(await etat()));
  await p.mouse.click(30, 400);   // passer
  await p.waitForTimeout(300);
  await p.locator('#debloqueScene [data-ferme]').click();
  await p.waitForTimeout(500);
  console.log('Continuer', JSON.stringify(await etat()));
  if(cas === 'trophees'){
    await p.evaluate(() => { document.querySelector('#speciesModal .sm-close, #speciesModal [data-close], #smClose')?.click(); });
    await p.waitForTimeout(400);
    if(!(await etat()).tro) await p.keyboard.press('Escape');
  } else {
    await p.evaluate(() => document.querySelector('.tab[data-view="trophies"]').click());
  }
  let vu = false;
  for(let i = 0; i < 14 && !vu; i++){ await p.waitForTimeout(500); vu = (await etat()).tro; }
  console.log('fin', JSON.stringify(await etat()));
  verifie(vu, cas + ' : la scène du trophée se joue');
  // Sans rien changer, la détection ne doit plus rien récrire : la mesure de la boucle.
  if(vu){ await p.locator('.tro-sc').click({ position:{ x:20, y:300 } }); await p.waitForTimeout(300); await p.locator('[data-tro-suite]').click(); }
  await p.evaluate(() => { window.__ecr = 0; const o = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if(String(k).startsWith('mb-trophees-') || k === 'mb-comp-state') window.__ecr++; return o.call(this, k, v); }; });
  await p.waitForTimeout(10000);
  const ecr = await p.evaluate(() => window.__ecr);
  verifie(ecr <= 1, 'au repos, écritures en 10 s : ' + ecr + ' (1 : la vérification qui suit la fermeture ; 10 avec la boucle)');
  verifie(!erreurs.length, 'erreurs : ' + erreurs.slice(0, 3).join(' / '));
  await ctx.close();
}
if(CAS !== 'trophees') await parcours('birdydex');
if(CAS !== 'birdydex') await parcours('trophees');
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
