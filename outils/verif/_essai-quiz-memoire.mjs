// Essai ponctuel (2026-10-26), démo locale : la mémoire du site remplie de copies d'eBird (« ebc: »)
// jusqu'au refus, le quiz arrive-t-il encore à écrire ? On remplit avant le chargement, puis on joue une
// manche du parcours ; la progression (mb-quiz-reponses) doit être écrite, quitte à vider les copies.
// node outils/verif/_essai-quiz-memoire.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
// Remplir : des copies récentes (moins de 3 jours), que le démarrage ne retire donc pas.
const rempli = await p.evaluate(() => {
  const gros = JSON.stringify({ ts:Date.now(), data:'x'.repeat(200000) });
  let n = 0; try{ for(; n < 200; n++) localStorage.setItem('ebc:essai-' + n, gros); }catch(_){}
  // Puis des copies de plus en plus petites, jusqu'au dernier octet : plus rien ne passe.
  for(let taille = 100000; taille >= 10; taille = Math.floor(taille / 2)){
    try{ for(;; n++) localStorage.setItem('ebc:essai-' + n, JSON.stringify({ ts:Date.now(), data:'x'.repeat(taille) })); }catch(_){}
  }
  let plein = false; try{ localStorage.setItem('__t', 'x'.repeat(50000)); localStorage.removeItem('__t'); }catch(_){ plein = true; }
  try{ localStorage.removeItem('mb-quiz-reponses'); }catch(_){}
  return { copies:n, plein };
});
console.log('mémoire remplie :', JSON.stringify(rempli));
await p.reload({ waitUntil:'load' });
await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="quiz"]').click());
await p.waitForTimeout(2500);
// Une réponse, n'importe laquelle : le premier bouton de choix d'une partie lancée.
const joue = await p.evaluate(async () => {
  const attendre = ms => new Promise(r => setTimeout(r, ms));
  // Le parcours : ouvrir une étape (data-pc-ouvrir / data-pc-etape), la jouer (data-pc-jouer), répondre
  // (.pc-reponse[data-pc-choix], la réponse qui passe par _pcNoterReponse).
  for(const sel of ['[data-pc-ouvrir]', '[data-pc-etape]', '[data-pc-jouer]']){
    const b = document.querySelector(sel); if(b){ b.click(); await attendre(800); }
  }
  for(let i = 0; i < 40; i++){
    await attendre(250);
    const choix = document.querySelector('.pc-reponse[data-pc-choix]');
    if(choix){ choix.click(); await attendre(300); const v = document.querySelector('[data-pc-valider]'); if(v) v.click(); return 'réponse donnée'; }
  }
  return 'pas de choix trouvé : ' + [...document.querySelectorAll('#viewQuiz button')].slice(0, 8).map(b => b.textContent.trim().slice(0, 20)).join(' | ');
});
await p.waitForTimeout(1500);
console.log('quiz :', joue);
console.log('après :', JSON.stringify(await p.evaluate(() => ({ progression:!!localStorage.getItem('mb-quiz-reponses'),
  copies:Object.keys(localStorage).filter(k => k.startsWith('ebc:')).length }))));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
