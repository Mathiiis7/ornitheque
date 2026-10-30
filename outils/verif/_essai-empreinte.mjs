// Essai ponctuel (2026-10-31), démo locale : l'empreinte morphologique de la carte Traits. Chaque fiche a son radar,
// sa phrase, ses cinq valeurs ; les lignes d'avant restent ; rien ne déborde ; le survol d'un point répond.
// node outils/verif/_essai-empreinte.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const ATTENDU = { 'Héron cendré':'Longues ailes, long bec, longues pattes pour son gabarit.', "Martin-pêcheur d'Europe":'Long bec, ailes courtes, pattes courtes, queue courte pour son gabarit.', 'Merle noir':'Bien dans la moyenne, rien qui dépasse.', 'Cygne tuberculé':'Ailes courtes, pattes courtes, queue courte pour son gabarit.' };
const nav = await chromium.launch();
let defauts = 0; const ecart = m => { console.log('   ÉCART : ' + m); defauts++; };
for(const [largeur, theme] of [[1300, 'light'], [375, 'light'], [1300, 'dark']]){
  const mobile = largeur < 700;
  const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block', colorScheme:theme });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"], .tab[data-view="birdydex"], .tab[data-view="dex"]')?.click()); await p.waitForTimeout(2000);
  await p.keyboard.press('Escape');
  console.log(`== ${largeur} ${theme}`);
  for(const [nom, phrase] of Object.entries(ATTENDU)){
    const ouvert = await p.evaluate(nom => { const c = [...document.querySelectorAll('.pkdx-card')].find(x => x.textContent.includes(nom)); if(c){ c.click(); return true; } return false; }, nom);
    if(!ouvert){ console.log('   pas de case pour', nom); continue; }
    await p.waitForFunction(() => { const b = document.getElementById('smTraitsCard'); return b && !b.hidden && b.querySelector('.sm-radar'); }, null, { timeout:8000 }).catch(() => ecart('pas de radar : ' + nom));
    const m = await p.evaluate(() => { const b = document.getElementById('smTraitsCard'), s = b.querySelector('.sm-radar svg'); if(!s) return null; const r = s.getBoundingClientRect(), c = b.getBoundingClientRect();
      return { phrase:b.querySelector('.sm-rd-phrase').textContent, valeurs:[...s.querySelectorAll('.sm-rd-val')].map(x => x.textContent), masse:b.textContent.includes('Masse'), large:Math.round(c.width), haut:Math.round(r.height), police:(14 * r.width / s.viewBox.baseVal.width).toFixed(1),
        dehors:[...s.querySelectorAll('text')].filter(t => { const q = t.getBoundingClientRect(); return q.left < c.left - .5 || q.right > c.right + .5; }).length, pagedeborde:document.documentElement.scrollWidth > innerWidth + 1 }; });
    console.log('  ', nom, JSON.stringify(m));
    if(m){ if(m.phrase !== phrase) ecart(`phrase de ${nom} : ${m.phrase}`); if(m.valeurs.length !== 5 || !m.masse) ecart('valeurs ou lignes manquantes'); if(m.dehors || m.pagedeborde) ecart('débordement'); if(+m.police < 11) ecart('texte trop petit ' + m.police); }
    if(nom === 'Héron cendré'){
      await p.evaluate(() => document.querySelector('#smTraitsCard .sm-radar').scrollIntoView({ block:'center' })); await p.waitForTimeout(400);
      if(!mobile){ const g = p.locator('#smTraitsCard .sm-radar g[data-tip]').nth(3); await g.hover({ force:true }); await p.waitForTimeout(700);
        const bulle = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetWidth && !e.children.length && /au-dessus de \d+ %/.test(e.textContent)).map(e => e.textContent)[0]);
        console.log('   survol :', bulle); if(!bulle) ecart('survol muet'); }
      await p.locator('#smTraitsCard').screenshot({ path:`${SORTIE}/empreinte-${largeur}-${theme}.png` });
    }
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  }
  console.log('   erreurs :', erreurs.length ? erreurs.slice(0, 3) : 'aucune'); if(erreurs.length) defauts++;
  await ctx.close();
}
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
