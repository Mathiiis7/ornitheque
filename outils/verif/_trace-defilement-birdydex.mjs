// Trace du navigateur pendant le défilement du Birdydex (2026-11-11) : temps passé par type de travail
// (peinture, tramage, décodage d'images, mise en page, style, composition...), pour savoir quoi alléger.
// Usage : node outils/verif/_trace-defilement-birdydex.mjs [port] [ralenti CPU]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766', ralenti = +(process.argv[3] || 1);
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1280, height:900 } });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => document.querySelector('[data-view="pokedex"]')?.click());
await p.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(p);
if(ralenti > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: ralenti });
const evts = [];
cdp.on('Tracing.dataCollected', d => evts.push(...d.value));
const fini = new Promise(r => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,cc,gpu,blink', transferMode: 'ReportEvents' });
await p.mouse.move(640, 500);
const t0 = Date.now();
while(Date.now() - t0 < 4000){ await p.mouse.wheel(0, 120); await p.waitForTimeout(40); }
await cdp.send('Tracing.end');
await fini;
const parNom = new Map();
for(const e of evts){ if(e.ph !== 'X' || !e.dur) continue; const k = e.name; const v = parNom.get(k) || [0, 0]; v[0] += e.dur; v[1]++; parNom.set(k, v); }
const garder = ['Paint', 'PaintImage', 'RasterTask', 'Decode Image', 'ImageDecodeTask', 'Layout', 'UpdateLayoutTree', 'RecalculateStyles', 'UpdateLayerTree', 'Layerize', 'PrePaint', 'CompositeLayers',
  'ScrollLayer', 'HitTest', 'EventDispatch', 'FunctionCall', 'TimerFire', 'FireAnimationFrame', 'ParseHTML', 'IntersectionObserverController::computeIntersections', 'ProxyMain::BeginMainFrame',
  'ThreadProxy::BeginMainFrame', 'LayerTreeHostImpl::PrepareToDraw', 'Commit', 'TileManager::AssignGpuMemoryToTiles', 'GpuRasterization', 'DisplayItemList::Raster', 'PaintArtifactCompositor::Update'];
console.log('travail du navigateur pendant 4 s de défilement (ms, nombre) :');
for(const [k, [d, n]] of [...parNom.entries()].sort((a, b) => b[1][0] - a[1][0]).slice(0, 30))
  if(d > 20000 || garder.includes(k)) console.log('  ' + (d / 1000).toFixed(0).padStart(6) + ' ms  ' + String(n).padStart(5) + '×  ' + k);
// Ce que la grille a de coûteux à peindre
console.log(await p.evaluate(() => {
  const c = document.querySelector('#pkdxGrid .pkdx-card'); if(!c) return 'pas de carte';
  const tous = [c, ...c.querySelectorAll('*')];
  const lourds = tous.map(e => { const s = getComputedStyle(e); return [e.className && String(e.className).slice(0, 30), s.filter !== 'none' ? 'filter:' + s.filter : '', s.boxShadow !== 'none' ? 'ombre' : '', s.backdropFilter && s.backdropFilter !== 'none' ? 'backdrop' : '', s.mixBlendMode !== 'normal' ? 'blend:' + s.mixBlendMode : '', s.willChange !== 'auto' ? 'will-change:' + s.willChange : ''].filter(Boolean).join(' '); }).filter(x => x.includes(':') || x.includes('ombre') || x.includes('backdrop'));
  const imgs = c.querySelectorAll('img');
  return 'carte : ' + lourds.join(' | ') + ' | images : ' + [...imgs].map(i => i.naturalWidth + 'x' + i.naturalHeight + ' affichée ' + Math.round(i.getBoundingClientRect().width)).join(', ');
}));
await nav.close();
