// Essai ponctuel (2026-10-31), démo locale : des fiches d'oiseaux étrangers, ouvertes par le code de la page. Radar pour
// ceux qui ont des mesures, y compris un genre renommé ; rien mais sans erreur pour un oiseau disparu.
// node outils/verif/_essai-traits-monde.mjs
import { chromium } from 'playwright';
const AVEC = ['daptrius chimango', 'pampusana stairi', 'emblema ruficauda', 'athene granti', 'dacelo novaeguineae', 'dromaius novaehollandiae', 'struthio camelus', 'anarhynchus mongolus', 'aegithalos exilis', 'turdus migratorius', 'spheniscus magellanicus', 'trochilus polytmus'];
const SANS = ['acrocephalus astrolabii', 'akialoa stejnegeri'];
const nav = await chromium.launch();
let defauts = 0;
for(const largeur of [1300, 375]){
  const mobile = largeur < 700;
  const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
  // Le module ne publie pas la fonction : on l'expose au vol, le fichier ne change pas.
  await ctx.route(/\/app\.js/, async r => { const rep = await r.fetch(); await r.fulfill({ response:rep, body:(await rep.text()) + '\n;window.__fiche = openSpeciesModal;' }); });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(2000);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  for(const sci of [...AVEC, ...SANS]){
    await p.evaluate(s => window.__fiche(s), sci);
    await p.waitForFunction(() => document.querySelector('#smTraitsCard .sm-radar'), null, { timeout:SANS.includes(sci) ? 2500 : 8000 }).catch(() => {});
    const m = await p.evaluate(() => { const b = document.getElementById('smTraitsCard'), s = b.querySelector('.sm-radar svg'), c = b.getBoundingClientRect(); return { visible:!b.hidden, phrase:b.querySelector('.sm-rd-phrase')?.textContent, vals:[...b.querySelectorAll('.sm-rd-val')].map(x => x.textContent).join(' · '), dehors:s ? [...s.querySelectorAll('text')].filter(t => { const q = t.getBoundingClientRect(); return q.left < c.left - .5 || q.right > c.right + .5; }).length : 0 }; });
    console.log(largeur, sci, JSON.stringify(m));
    const attendu = AVEC.includes(sci);
    if(attendu !== !!m.phrase || m.dehors){ console.log('   ÉCART'); defauts++; }
    await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  }
  console.log('erreurs', erreurs.length ? erreurs.slice(0, 3) : 'aucune'); if(erreurs.length) defauts++;
  await ctx.close();
}
await nav.close();
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
