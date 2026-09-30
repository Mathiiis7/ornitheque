"""La partition sonore du film : les bruitages, et le chant de l'hirondelle.

Les instants ne sont PAS recopies a la main : ils sont lus dans la composition elle-meme,
par window.__events(). Si un moment se deplace, son bruitage se deplace avec lui - c'est la
regle du skill, et elle evite la derive silencieuse entre l'image et le son.

Le chant n'est pas un bruitage : c'est l'enregistrement que l'appli fait ecouter, celui
d'Olivier SWIFT (xeno-canto 1149071, CC BY-NC-SA), credite a la fin du film.

    .onetake/venv/Scripts/python.exe tools/onetake/partition.py
"""

import json
import pathlib
import subprocess
import sys
import wave

import numpy as np

SKILL = pathlib.Path(".claude/skills/onetake")
sys.path.insert(0, str((SKILL / "scripts").resolve()))
import sfx_palette as P  # noqa: E402

FILM = pathlib.Path(".onetake/film")
SORTIE = FILM / "son.wav"
SR = P.SR


def evenements():
    """Lit la liste des evenements dans la composition, via un navigateur."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        nav = p.chromium.launch()
        page = nav.new_page()
        page.goto("file:///" + str((FILM / "comp.html").resolve()).replace("\\", "/"))
        page.wait_for_function("window.__events !== undefined", timeout=30000)
        ev = page.evaluate("window.__events()")
        nav.close()
    return ev


def decode(mp3):
    """Decode un mp3 en mono 48 kHz avec ffmpeg : numpy ne lit pas le mp3."""
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", str(SR),
         "-f", "f32le", "-"],
        capture_output=True, check=True,
    )
    return np.frombuffer(out.stdout, dtype=np.float32).astype(float)


def meilleur_extrait(x, duree):
    """La fenetre la plus chantante : energie maximale entre 2 et 8 kHz.

    Un enregistrement de terrain commence souvent par du vent et des reglages. Prendre les
    premieres secondes donnerait du silence ; on cherche donc ou l'oiseau chante vraiment.
    """
    bande = P.bp(x, 4000, q=0.7)
    n = int(duree * SR)
    if len(bande) <= n:
        return x
    # Energie glissante, calculee par somme cumulee : une fenetre par centieme de seconde.
    pas = SR // 100
    carres = np.cumsum(np.concatenate([[0.0], bande ** 2]))
    scores = [(carres[i + n] - carres[i], i) for i in range(0, len(bande) - n, pas)]
    _, i0 = max(scores)
    print(f"  extrait retenu : {i0 / SR:.1f} s a {(i0 + n) / SR:.1f} s sur "
          f"{len(x) / SR:.1f} s d'enregistrement")
    return x[i0:i0 + n]


def enveloppe(n, montee, descente):
    """Fondu d'entree et de sortie, en cosinus : pas de clic aux bords."""
    e = np.ones(n)
    a, b = int(montee * SR), int(descente * SR)
    if a: e[:a] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, a))
    if b: e[-b:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, b))
    return e


def main():
    ev = evenements()
    duree = ev["T"]
    s = P.Score(dur=duree, T60=1.15)
    print(f"partition : {duree} s, {len(ev['events'])} evenements")

    # --- Les bruitages, un par contact ------------------------------------------------
    # Chaque matiere a sa hauteur : le bois pour ce qu'on pose, le verre pour ce qui se
    # range, le souffle pour ce qui s'ouvre, le grave pour ce qui se referme.
    for e in ev["events"]:
        t, k, pan, v = e["t"], e["kind"], e["pan"], e["v"]
        if k == "air":
            # Le souffle de l'ouverture du monde est le plus long du film.
            longue = v > 0.8
            sig = P.air(dur=1.1 if longue else 0.5, f0=180, f1=3200 if longue else 2200,
                        q=1.3, shape=0.5)
            s.place(sig, t - 0.12, gain=v * 0.85, pan=pan, send=0.6, pan_to=pan * -0.5)
        elif k == "wood":
            s.place(P.wood(f=190, dur=0.13), t, gain=v * 0.9, pan=pan, send=0.18)
            s.place(P.wood(f=150, dur=0.10), t + 0.055, gain=v * 0.5, pan=pan, send=0.18)
        elif k == "bubble":
            s.place(P.bubble(f=560, dur=0.22), t, gain=v * 0.8, pan=pan, send=0.3)
        elif k == "glass":
            s.place(P.glass(784, 0.85), t, gain=v * 0.55, pan=pan, send=0.5)
            s.place(P.glass(1175, 0.7, 0.6), t + 0.09, gain=v * 0.38, pan=pan * -1, send=0.55)
        elif k == "sub":
            s.place(P.sub(f=58, dur=0.75), t, gain=v * 0.95, pan=0, send=0.2)

    # --- Le chant de l'hirondelle -----------------------------------------------------
    ch = ev.get("chant") or {}
    mp3 = FILM / "assets" / "chant.mp3"
    if ch and mp3.exists():
        duree_chant = ch["jusqua"] - ch["t"]
        brut = decode(mp3)
        extrait = meilleur_extrait(brut, duree_chant)
        extrait = extrait / (np.abs(extrait).max() + 1e-9)
        extrait = extrait * enveloppe(len(extrait), 0.12, 0.45)
        # Un peu en retrait : le chant accompagne l'image, il ne la couvre pas.
        s.place(extrait, ch["t"], gain=0.5, pan=-0.12, send=0.3)
        print(f"  chant place a {ch['t']} s pendant {duree_chant:.1f} s")
    else:
        print("  ATTENTION : pas de chant, assets/chant.mp3 est absent")

    s.write(str(SORTIE), peak_db=-8.0)

    # Verifier les silences voulus : l'oracle compte les images muettes, et c'est la que
    # le film respire. Une trainee de reverberation peut les remplir sans qu'on l'entende.
    with wave.open(str(SORTIE)) as w:
        son = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        son = son.reshape(-1, 2).astype(float) / 32768
    for a, b in ev.get("silences", []):
        bout = son[int(a * SR):int(b * SR)]
        if not len(bout):
            continue
        db = 20 * np.log10(np.sqrt((bout ** 2).mean()) + 1e-12)
        etat = "silencieux" if db < -45 else "PAS assez silencieux"
        print(f"  silence {a:>5.1f} - {b:<5.1f} s : {db:6.1f} dB  {etat}")


if __name__ == "__main__":
    main()
