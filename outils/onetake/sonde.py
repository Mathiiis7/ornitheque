"""Sonde : liste les blocs visibles de chaque etat filme, pour choisir les morceaux a animer.

Sortie : .onetake/sonde.txt. Un bloc par ligne : balise#id.classe x y l h, sans les blocs qui
occupent exactement la place de leur parent (ils n'apprennent rien).

    .onetake/venv/Scripts/python.exe outils/onetake/sonde.py
"""

import pathlib
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pilote as P  # noqa: E402

JS = """() => {
  const out = [];
  const vis = e => { const r = e.getBoundingClientRect();
    return r.width >= 60 && r.height >= 24 && r.bottom > 0 && r.top < innerHeight
           && r.right > 0 && r.left < innerWidth; };
  const walk = (e, d) => {
    if (d > 7) return;
    for (const c of e.children) {
      if (!vis(c)) continue;
      const r = c.getBoundingClientRect(), pr = e.getBoundingClientRect();
      const meme = Math.abs(r.width - pr.width) < 2 && Math.abs(r.height - pr.height) < 2;
      if (!meme && (c.id || c.className)) {
        const cls = (typeof c.className === 'string') ? c.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
        out.push('  '.repeat(d) + c.tagName.toLowerCase() + (c.id ? '#' + c.id : '')
                 + (cls ? '.' + cls : '') + '  '
                 + Math.round(r.left) + ',' + Math.round(r.top) + ' '
                 + Math.round(r.width) + 'x' + Math.round(r.height));
      }
      walk(c, d + 1);
    }
  };
  walk(document.body, 0);
  return out;
}"""

SORTIE = pathlib.Path(".onetake/sonde.txt")


def main():
    lignes = []
    with sync_playwright() as p:
        nav, page, _ = P.ouvre(p)

        def etat(nom):
            lignes.append("\n=== " + nom)
            lignes.extend(page.evaluate(JS))

        P.birdydex(page)
        etat("mur (haut)")
        P.ouvre_fiche(page)
        P.onglet_fiche(page, "Info")
        etat("fiche info")
        P.onglet_fiche(page, "Sons")
        try:
            page.wait_for_selector(".xa-bar-sono", timeout=25000)
        except Exception:
            lignes.append("(pas de sonagramme)")
        page.wait_for_timeout(1500)
        etat("fiche sons")
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)
        P.onglet(page, "Classement")
        page.wait_for_timeout(3000)
        etat("classement")
        P.onglet(page, "Quiz")
        page.wait_for_timeout(2500)
        page.evaluate(
            """() => { const b = [...document.querySelectorAll('button')]
                .find(b => /Lancer le quiz/.test(b.textContent)); if (b) b.click(); }""")
        page.wait_for_timeout(8000)
        etat("quiz")
        page.evaluate(
            """() => { const b = [...document.querySelectorAll('button,[role=button],a')]
                .find(b => (b.textContent || '').includes('\\u{1F4AC}')); if (b) b.click(); }""")
        page.wait_for_timeout(2500)
        etat("chat")
        nav.close()
    SORTIE.write_text("\n".join(lignes), encoding="utf-8")
    print(f"{len(lignes)} lignes -> {SORTIE}")


if __name__ == "__main__":
    main()
