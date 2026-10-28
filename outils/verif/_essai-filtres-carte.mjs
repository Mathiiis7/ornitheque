// Essai ponctuel (2026-10-28), démo locale : les filtres des trois onglets de la Carte dans leur bloc
// gris (maquette A3). Captures de chaque bloc, débordements, tailles, et chaque commande essayée.
// node outils/verif/_essai-filtres-carte.mjs [largeur]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/114db7bd-8fd3-4659-8df7-c4a94d9f07db/scratchpad';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 950 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', colorScheme:process.env.SOMBRE ? 'dark' : 'light' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto(process.env.BASE || 'http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1200); };
const clic = async sel => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(500); };
const onglet = async k => { await clic(`#ctOnglets [data-onglet="${k}"]`); await p.evaluate(k => { document.querySelector(`[data-ct-allume="${k}"]`)?.click(); }, k); await p.waitForTimeout(800); };
if(mobile) await p.evaluate(() => document.getElementById('ctZone').dataset.tiroir = 'haut');

// Tailles et débordements d'un bloc : tout ce qui sort du bloc, la hauteur des commandes, le plus
// petit texte (hors pastilles de rareté), les noms des lignes.
const mesure = pli => p.evaluate(pli => {
  const d = document.getElementById(pli); d.open = true;
  const bloc = d.querySelector('.ct-bloc'), b = bloc.getBoundingClientRect();
  const deborde = [...bloc.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > b.right + 0.5 || r.left < b.left - 0.5); })
    .map(e => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().right - b.right));
  const coupe = [...bloc.querySelectorAll('button, .cp-btn-label, .ct-k, label span')].filter(e => e.offsetWidth && e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim());
  const cmd = [...bloc.querySelectorAll('.seg button, .cp-btn, .ct-bascule input, .ct-pas, .ct-annee input')].filter(e => e.offsetWidth)
    .map(e => Math.round(e.getBoundingClientRect().height));
  const petits = [...bloc.querySelectorAll('*')].filter(e => e.offsetWidth && e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !e.closest('.rar-chips'))
    .map(e => parseFloat(getComputedStyle(e).fontSize)).sort((a, c) => a - c)[0];
  const lignes = [...bloc.querySelectorAll('.ct-ligne')].filter(l => l.offsetHeight).map(l => l.querySelector('.ct-k').textContent);
  const debutsK = [...new Set([...bloc.querySelectorAll('.ct-ligne')].filter(l => l.offsetHeight).map(l => Math.round(l.querySelector('.ct-v, .seg, .ct-bascule, .ct-choix')?.getBoundingClientRect().left - b.left)))];
  return { lignes, deborde, coupe, hauteursCommandes:[...new Set(cmd)], plusPetitTexteCSS:petits, departDesCommandes:debutsK,
    pageDeborde:document.documentElement.scrollWidth > innerWidth, doigt:matchMedia('(pointer: coarse)').matches };
}, pli);
const capture = async (pli, nom) => {
  await p.evaluate(pli => document.getElementById(pli).scrollIntoView({ block:'start' }), pli);
  await p.waitForTimeout(300);
  await p.locator('#ctZone').screenshot({ path:`${DOS}/filtres-${nom}-${largeur}.png` });
};

// Récent, Grand Est
await onglet('recent');
await regle('mapEbRegion', 'FR-GES');
await p.waitForTimeout(3000);
console.log('RÉCENT', JSON.stringify(await mesure('ctPliRecent')));
await capture('ctPliRecent', 'recent');
const lis = () => p.evaluate(() => ({
  jours:document.getElementById('mapEbDays').value, source:document.getElementById('mapEbSource').value,
  joursVisibles:!!document.getElementById('mapEbDaysLbl').offsetWidth, anneesVisibles:!!document.getElementById('mapEbYearMinLbl').offsetWidth,
  manqueRec:document.getElementById('ctRecManque').checked, manqueHot:document.getElementById('ctHotManque').checked, inclureObs:document.getElementById('mapEbShowObserved').checked,
  portee:[...document.querySelectorAll('#ctPortee [data-ct-portee]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '') + (b.getAttribute('aria-disabled') === 'true' ? '(gris)' : '')),
  paliersOn:document.querySelectorAll('#mapEbRarityChips .rar-chip[data-rar].on').length,
  note:document.querySelector('#ctPliRecent [data-portee-note]').textContent,
}));
console.log('  départ', JSON.stringify(await lis()));
await clic('[data-ct-jours="7"]'); console.log('  7 j', JSON.stringify(await lis()));
await clic('[data-ct-jours="14"]');
await clic('[data-ct-source="gbif"]'); console.log('  années passées', JSON.stringify(await lis()));
await capture('ctPliRecent', 'recent-gbif');
await clic('[data-ct-source="ebird"]');
await clic('#ctRecManque'); console.log('  manque décoché', JSON.stringify(await lis()));
await clic('#ctRecManque');
await clic('[data-rar-none][data-rar-pour="mapEbRarityChips"]'); console.log('  aucun', JSON.stringify(await lis()));
await clic('[data-rar-all][data-rar-pour="mapEbRarityChips"]'); console.log('  tout', JSON.stringify(await lis()));
await clic('#ctPortee [data-ct-portee="zone"]'); console.log('  zone', JSON.stringify(await lis()));
await clic('#ctPortee [data-ct-portee="pays"]');

// Hotspots
await onglet('hot');
await p.waitForTimeout(2000);
const zoneIci = await p.evaluate(() => !!document.querySelector('[data-ici-zone="hot"] #ctEbPaysBtn'));
console.log('HOTSPOTS, case du lieu dans « Où » :', zoneIci, JSON.stringify(await mesure('ctPliHot')));
await capture('ctPliHot', 'hot');
const lisH = () => p.evaluate(() => ({ tri:document.getElementById('mapEbSort').value, moisVisible:!!document.getElementById('mapEbMonthLbl').offsetWidth,
  cacherVisible:!!document.getElementById('mapEbMinTodoLbl').offsetWidth, min:document.getElementById('mapEbMinTodo').value,
  triOn:[...document.querySelectorAll('[data-ct-tri]')].filter(b => b.classList.contains('on')).map(b => b.textContent),
  mois:document.querySelector('[data-ct-choix="mapEbMonth"] .cp-btn-label').textContent, compte:document.getElementById('mapEbCount').textContent.slice(0, 80) }));
console.log('  départ', JSON.stringify(await lisH()));
await clic('#mapEbMinTodoInc'); await clic('#mapEbMinTodoInc'); console.log('  +2', JSON.stringify(await lisH()));
await clic('#mapEbMinTodoDec'); await clic('#mapEbMinTodoDec');
await clic('[data-ct-tri="recent"]'); console.log('  activité', JSON.stringify(await lisH()));
await clic('[data-ct-tri="todo"]');
await clic('#ctHotManque'); console.log('  manque décoché aux Hotspots', JSON.stringify(await lis()));
await clic('#ctHotManque');

// Ligue
await onglet('ligue');
await p.waitForTimeout(1500);
console.log('LIGUE', JSON.stringify(await mesure('ctPliLigue')));
await capture('ctPliLigue', 'ligue');
console.log('  lieu', await p.evaluate(() => document.querySelector('#ctLigPaysBtn .cp-btn-label').textContent), 'pays filtré', await p.evaluate(() => document.getElementById('mapCountrySel').value));
await clic('#mapMineShowAllObs'); console.log('  tous les cochages', await p.evaluate(() => document.getElementById('mapMineShowAllObs').checked));
await clic('#mapMineShowAllObs');
// Où de la Ligue : la fenêtre s'ouvre, choisir l'Espagne l'ouvre sur la carte
await clic('#ctLigPaysBtn'); await p.waitForTimeout(800);
const fen = await p.evaluate(() => { const m = document.querySelector('.cp-modal-backdrop'); return m ? [...m.querySelectorAll('.cp-item[data-cc]')].map(x => x.dataset.cc).join(',') : 'pas de fenêtre'; });
console.log('  fenêtre Où (pays proposés)', fen);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop .cp-item[data-cc="FR"]')?.click()); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop')?.click()); await p.waitForTimeout(800);
console.log('  après France', await p.evaluate(() => [document.querySelector('.ct-zone-nom')?.textContent, document.querySelector('#ctLigPaysBtn .cp-btn-label').textContent, document.getElementById('mapCountrySel').value]));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
