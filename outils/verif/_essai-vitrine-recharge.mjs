// Un trophee debloque dans la vitrine le reste-t-il apres un rechargement ? (Mathis, 2026-11-11 : les trophees a
// vote redemandaient a etre debloques a chaque rechargement.) On debloque tout ce qui attend, on recharge deux
// fois, et on compte ce qui attend encore, trophees a vote en tete.
// Usage : node outils/verif/_essai-vitrine-recharge.mjs [adresse de la demo]
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:8765/demo/';
const nav = await chromium.launch();
const ctx = await nav.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
// Trois votes pour « moi » (demo-visiteur) ajoutes a la fausse ligue, et les votes livres 3 s apres le reste,
// comme sur le vrai site ou ils arrivent apres le premier dessin de la vitrine.
await ctx.route(u => u.pathname.endsWith('/demo/donnees.js'), async route => {
  const rep = await route.fetch();
  const ajout = ['necrophile', 'grosBebe', 'kimono'].map(v => "DONNEES['leagues/merlin-bird/votes/" + v + "__demo-visiteur__demo-claire'] = { trophy:'" + v + "', target:'demo-visiteur', voter:'demo-claire' };").join(String.fromCharCode(10));
  route.fulfill({ response: rep, body: (await rep.text()) + String.fromCharCode(10) + ajout, headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
// La demo cache l'etage « Fun » (TROPHEES_FUN_VISIBLES) : on le montre le temps de l'essai.
await ctx.route(u => u.pathname.endsWith('/app.js'), async route => {
  const rep = await route.fetch();
  const corps = (await rep.text()).replace("const TROPHEES_FUN_VISIBLES = !location.pathname.includes('/demo/');", 'const TROPHEES_FUN_VISIBLES = true;');
  route.fulfill({ response: rep, body: corps, headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
await ctx.route(u => u.pathname.endsWith('/demo/bouchons/firebase-firestore.js'), async route => {
  const rep = await route.fetch();
  const corps = (await rep.text()).replace('setTimeout(() => livrer(chemin, inscrit), 0);', "setTimeout(() => livrer(chemin, inscrit), chemin.endsWith('/votes') ? 3000 : 0);");
  route.fulfill({ response: rep, body: corps, headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
const p = await ctx.newPage();
const ouvrir = async () => {
  await p.waitForTimeout(4000);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="trophies"]')?.click());
  await p.waitForTimeout(4000);
  // Une scene de trophee qui se joue d'elle-meme : on la ferme.
  for(let i = 0; i < 10; i++){ const d = await p.evaluate(() => { const x = document.querySelector('dialog[open]'); if(x){ x.close(); return true; } return false; }); if(!d) break; await p.waitForTimeout(300); }
};
const attente = () => p.evaluate(() => [...document.querySelectorAll('#vitrine .vt-case.vt-attend')].map(c => c.dataset.id));
await p.goto(url, { waitUntil: 'load' });
await ouvrir();
const votes = await p.evaluate(() => [...document.querySelectorAll('#vitrine .vt-case')].filter(c => /Nécrophile|Gros Bébé|kimono/i.test(c.dataset.id)).map(c => c.dataset.id + (c.classList.contains('vt-attend') ? ' (a debloquer)' : '')));
let a = await attente();
console.log('trophees a vote gagnes :', votes.join(', ') || 'aucun', '| en attente au depart :', a.length);
for(let tour = 0; tour < 40 && a.length; tour++){
  await p.evaluate(id => document.querySelector(`#vitrine .vt-case[data-id="${CSS.escape(id)}"]`)?.click(), a[0]);
  for(let i = 0; i < 30; i++){ await p.waitForTimeout(500); if(!(await attente()).includes(a[0])) break; }
  await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  a = await attente();
}
console.log('en attente apres deblocage :', a.length);
let ok = !a.length;
for(const n of [1, 2]){
  await p.reload({ waitUntil: 'load' });
  await ouvrir();
  const r = await attente();
  if(r.length) ok = false;
  console.log(`rechargement ${n} : ${r.length} en attente`, r.join(', '));
}
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();
