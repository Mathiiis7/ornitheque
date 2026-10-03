# Essai du 2026-10-02 : compteur 0 -> 212 a cote de « Collectionne. », 5 s, camera fixe, sans main.
# Lancer depuis .onetake/ : python3 ../outils/onetake/essai-compteur.py, puis render.py sur film/comp-compteur.html.
# Rendu valide par Mathis : .onetake/essai-compteur-5s.mp4, a reutiliser dans le film.
import re, io
src = io.open('film/comp.html', encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in src else '\n'
src = src.replace('\r\n', '\n')

def sub(old, new, count=1):
    global src
    assert src.count(old) >= 1, old
    src = src.replace(old, new, count)

sub('const FPS = 30, DUR = 48.0;', 'const FPS = 30, DUR = 5.0;')
# camera fixe : l'essai ne teste que le compteur
sub('function camera(t) {', 'function camera(t) { return { x: 960, y: 575, z: 0.90 };\n}\nfunction cameraFilm(t) {')
# pas de main dans l'essai
sub('function dessineMain(t, cam) {', 'function dessineMain(t, cam) {\n  return;')
# le compteur
compteur = '''
// --- Le compteur : l'essai du 2026-10-02 ---------------------------------------------------
// 212 est le total reel du Birdydex de la demo (212 / 466). Il monte pendant que les cartes se
// posent (de T.CARTES a la derniere carte), puis le chiffre se repose : un repos immobile.
const TOTAL = 212, SUR = 466;
const CPT0 = T.CARTES, CPT1 = T.CARTES + 36 * T.PAS_CARTE + 0.9;
function dessineCompteur(t) {
  if (t < CPT0 - 0.05) return;
  const v = Math.round(TOTAL * OM.ease.expoOut(clamp((t - CPT0) / (CPT1 - CPT0), 0, 1)));
  const px = 150, droite = 1824, base = 172;
  ctx.save();
  ctx.font = police('display', px);
  ctx.textBaseline = 'alphabetic';
  let cell = 0;
  for (let d = 0; d <= 9; d++) cell = Math.max(cell, ctx.measureText(String(d)).width);
  ctx.font = police('display', 64);
  const sur = '/ ' + SUR;
  const wSur = ctx.measureText(sur).width;
  ctx.fillStyle = L.mute;
  ctx.fillText(sur, droite - wSur, base);
  ctx.font = police('display', px);
  ctx.fillStyle = L.ink;
  const s = String(v);
  ctx.textAlign = 'center';
  for (let i = 0; i < s.length; i++) {
    const x = droite - wSur - 28 - (s.length - i - 0.5) * cell;
    ctx.fillStyle = (v === TOTAL) ? L.accent : L.ink;
    ctx.fillText(s[i], x, base);
  }
  ctx.textAlign = 'right';
  ctx.font = police('text', 28);
  ctx.fillStyle = L.mute;
  ctx.fillText('esp\u00e8ces vues', droite, base + 52);
  ctx.restore();
}
'''
sub('// --- Les scenes ----', compteur + '\n// --- Les scenes ----')
sub('  dessineMot(t);\n  dessineMain(t, cam);', '  dessineMot(t);\n  dessineCompteur(t);\n  dessineMain(t, cam);')
sub('const nn = t < T.SAISIE ?', 'const nn = -1; const nn_ = t < T.SAISIE ?')
# pas de son ni de scenes tardives necessaires, mais on les laisse : elles ne s'activent pas avant 5 s
io.open('film/comp-compteur.html', 'w', encoding='utf-8', newline='').write(src.replace('\n', nl))
print('ok', len(src))
