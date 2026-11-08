// Constat (2026-11-08) : la fiche espèce à l'ordinateur (1440) et au téléphone (390, doigt), onglet par onglet.
// Pour chaque onglet : les commandes visibles (boutons, liens, champs, listes), celles qui sortent de l'écran,
// les textes coupés, les textes de moins de 14 px ; captures écran par écran en descendant dans la fiche.
// Ouvre la fiche en cliquant un nom d'espèce de « Ma liste », comme un membre.
import { chromium } from 'playwright';
import fs from 'fs';
const dossier = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/notes-privees/chantier-telephone/fiche/';
fs.mkdirSync(dossier, { recursive: true });
const SCI = process.argv[2] || 'parus major';
const navigateur = await chromium.launch();
const resultat = {};
for (const [nom, w, h, tel] of [['ordi', 1440, 900, false], ['tel', 390, 844, true]]) {
  const ctx = await navigateur.newContext({ viewport: { width: w, height: h }, isMobile: tel, hasTouch: tel, deviceScaleFactor: tel ? 2 : 1 });
  const page = await ctx.newPage();
  const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
  await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(sci => { document.querySelectorAll('dialog[open]').forEach(d => d.close());
    const a = document.createElement('a'); a.href = '#'; a.className = 'sp-link'; a.dataset.sci = sci; a.textContent = 'x';
    document.querySelector('main, body').appendChild(a); a.click(); a.remove(); }, SCI);
  await page.waitForTimeout(3000);
  resultat[nom] = {};
  for (const onglet of ['info', 'map', 'sound']) {
    await page.evaluate(o => document.querySelector('.sm-tab[data-sm-tab="' + o + '"]').click(), onglet);
    await page.waitForTimeout(onglet === 'sound' ? 4000 : 2500);
    const r = await page.evaluate(() => {
      const W = innerWidth, box = document.querySelector('.sm-box'), scroll = box.querySelector('.sm-scroll');
      const visible = e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let p = e; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden') return false; if (p.hidden) return false; } return true; };
      const nomDe = e => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.value || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
      const cmd = [...box.querySelectorAll('button, a[href], select, input, [role=button], [role=tab], summary, audio')].filter(visible);
      const commandes = cmd.map(e => nomDe(e));
      const horsEcran = cmd.filter(e => { const r = e.getBoundingClientRect(); return r.right > W + 1 || r.left < -1; }).map(nomDe);
      const petites = cmd.filter(e => { const r = e.getBoundingClientRect(); return r.width < 32 || r.height < 32; }).map(e => nomDe(e) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      const coupes = [...box.querySelectorAll('*')].filter(e => visible(e) && e.children.length === 0 && e.textContent.trim() && (e.scrollWidth > e.clientWidth + 1) && ['hidden', 'clip'].includes(getComputedStyle(e).overflowX)).map(e => e.textContent.trim().slice(0, 40));
      const petitTexte = new Set();
      for (const e of box.querySelectorAll('*')) { if (!visible(e)) continue; const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(''); if (!t) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13.5) petitTexte.add(Math.round(fs * 10) / 10 + 'px « ' + t.slice(0, 30) + ' »'); }
      const debordeFiche = box.scrollWidth > box.clientWidth + 1 || (scroll && scroll.scrollWidth > scroll.clientWidth + 1);
      return { commandes, horsEcran, petites, coupes: [...new Set(coupes)].slice(0, 15), petitTexte: [...petitTexte].slice(0, 25), debordeFiche, hauteur: scroll ? scroll.scrollHeight : 0 };
    });
    // Captures en descendant dans la fiche, un écran à la fois (fullPage retirerait l'émulation du téléphone).
    const n = Math.min(6, Math.ceil(r.hauteur / (h * 0.8)) || 1);
    for (let i = 0; i < n; i++) {
      await page.evaluate(y => { const s = document.querySelector('.sm-scroll'); if (s) s.scrollTop = y; }, i * h * 0.8);
      await page.waitForTimeout(400);
      await page.screenshot({ path: dossier + nom + '-' + onglet + '-' + (i + 1) + '.png' });
    }
    await page.evaluate(() => { const s = document.querySelector('.sm-scroll'); if (s) s.scrollTop = 0; });
    r.captures = n;
    resultat[nom][onglet] = r;
  }
  resultat[nom].erreurs = erreurs;
  await ctx.close();
}
await navigateur.close();
fs.writeFileSync(dossier + 'mesures.json', JSON.stringify(resultat, null, 1));
// Ce qui est à l'ordinateur et pas au téléphone, onglet par onglet.
for (const o of ['info', 'map', 'sound']) {
  const ordi = new Set(resultat.ordi[o].commandes), tel = new Set(resultat.tel[o].commandes);
  console.log('== ' + o + ' : ' + ordi.size + ' commandes ordi, ' + tel.size + ' tel');
  console.log('  seulement ordi :', [...ordi].filter(x => !tel.has(x)).join(' | ') || '-');
  console.log('  seulement tel  :', [...tel].filter(x => !ordi.has(x)).join(' | ') || '-');
  console.log('  tel hors écran :', resultat.tel[o].horsEcran.join(' | ') || '-');
  console.log('  tel petites    :', resultat.tel[o].petites.join(' | ') || '-');
  console.log('  tel coupés     :', resultat.tel[o].coupes.join(' | ') || '-');
  console.log('  tel déborde    :', resultat.tel[o].debordeFiche, '| captures', resultat.tel[o].captures);
}
console.log('erreurs', resultat.ordi.erreurs.length, resultat.tel.erreurs.length);
