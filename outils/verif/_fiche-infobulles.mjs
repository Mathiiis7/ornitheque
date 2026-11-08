// Constat (2026-11-08) : dans la fiche espèce, les infobulles (title ou data-tip) posées sur des éléments
// qui ne sont ni bouton ni lien. À la souris, on les lit au survol ; sur iPhone, toucher un élément qui n'est
// pas cliquable n'envoie pas de survol : ces textes-là sont inatteignables au doigt. Liste par onglet.
import { chromium } from 'playwright';
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close());
  const a = document.createElement('a'); a.href = '#'; a.className = 'sp-link'; a.dataset.sci = 'parus major'; a.textContent = 'x';
  document.body.appendChild(a); a.click(); a.remove(); });
await page.waitForTimeout(3000);
for (const onglet of ['info', 'map', 'sound']) {
  await page.evaluate(o => document.querySelector('.sm-tab[data-sm-tab="' + o + '"]').click(), onglet);
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const box = document.querySelector('.sm-box'), out = new Map();
    for (const e of box.querySelectorAll('[title], [data-tip]')) {
      if (!e.getBoundingClientRect().width) continue;
      if (e.closest('button, a[href], select, input, summary, [role=button]')) continue;
      const t = (e.getAttribute('data-tip') || e.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
      if (!t) continue;
      const cle = (e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName.toLowerCase());
      if (!out.has(cle)) out.set(cle, { n: 0, ex: t.slice(0, 70) });
      out.get(cle).n++;
    }
    return [...out].map(([k, v]) => k + ' ×' + v.n + ' : « ' + v.ex + ' »');
  });
  console.log('== ' + onglet); r.forEach(x => console.log('  ' + x));
}
await navigateur.close();
