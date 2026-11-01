"""La bande son du film v2 : un fond (nappe et feuilles, CC0), deux vrais chants, peu de bruitages.

Le film est monte en morceaux (montage-v2.py) : chaque instant s'ecrit dans le temps de son morceau, et
le debut des morceaux se calcule sur leurs vraies durees. Si un morceau change de rythme, reprendre ses instants ici.

    .onetake/venv/Scripts/python.exe outils/onetake/partition-v2.py VIDEO-ENTREE VIDEO-SORTIE

Les chants : xeno-canto, CC BY-NC-SA 4.0, ceux que le film montre et que ses credits nomment.
"""
import json, pathlib, re, subprocess, sys, urllib.request
import numpy as np

SKILL = pathlib.Path(".claude/skills/onetake")
sys.path.insert(0, str((SKILL / "scripts").resolve()))
import sfx_palette as P

OUT = pathlib.Path(".onetake/son")
OUT.mkdir(parents=True, exist_ok=True)
SR = P.SR
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
NAPPE, FEUILLES = ".onetake/musique/nappe-bartmann.mp3", ".onetake/musique/feuilles-borgory.mp3"

# Les morceaux, dans l'ordre de montage-v2.py. Une scene du site : (debut, fin, vitesse) de ses tranches.
def duree(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                                capture_output=True, text=True, check=True).stdout)

SCENE = lambda tranches: sum((b - a) / v for a, b, v in tranches)
DUREES = {"m2": 15.1, "mur": duree(".onetake/mur-a.mp4"), "debloque": SCENE([(0, 5.0, 1.2), (5.0, 6.5, 0.75)]), "retour": duree(".onetake/mur-c.mp4"),
          "trophee": SCENE([(0, 0.45, 1), (0.45, 6.2, 1.2), (6.2, 7.6, 0.8)]), "classement": duree(".onetake/m3-e.mp4"), "fiche": duree(".onetake/m3-f.mp4"),
          "monde": duree(".onetake/m3-m.mp4"), "recent": duree(".onetake/m3-g.mp4"), "fin": duree(".onetake/fin.mp4")}
DEBUT, t0 = {}, 0.0
for nom, d in DUREES.items():
    DEBUT[nom] = t0
    t0 += d
TOTAL = t0


def bois(s, t, v=0.5, f=190, pan=0.0):
    s.place(P.wood(f=f, dur=0.13), t, gain=v * 0.9, pan=pan, send=0.18)


def clic(s, t, pan=0.0):
    """Le clic de la fleche : deux contacts a 55 ms, l'appui et le retour."""
    s.place(P.wood(f=210, dur=0.09), t, gain=0.4, pan=pan, send=0.15)
    s.place(P.wood(f=170, dur=0.08), t + 0.055, gain=0.22, pan=pan, send=0.15)


def souffle(s, t, v=0.45, long=False, pan=0.0):
    s.place(P.air(dur=1.0 if long else 0.5, f0=180, f1=3000 if long else 2200, q=1.3, shape=0.5), t - 0.1, gain=v * 0.8, pan=pan, send=0.6, pan_to=pan * -0.5)


def verre(s, t, v=0.4, pan=0.0):
    s.place(P.glass(784, 0.85), t, gain=v * 0.55, pan=pan, send=0.5)
    s.place(P.glass(1175, 0.7, 0.6), t + 0.09, gain=v * 0.38, pan=-pan, send=0.55)


def grave(s, t, v=0.6):
    s.place(P.sub(f=58, dur=0.75), t, gain=v * 0.95, pan=0, send=0.2)


def bulle(s, t, v=0.3, pan=0.0):
    s.place(P.bubble(f=560, dur=0.22), t, gain=v * 0.8, pan=pan, send=0.3)


def lit(fichier, debut=None, longueur=None, filtre=None):
    a = ["ffmpeg", "-v", "error"]
    if debut is not None:
        a += ["-ss", str(debut)]
    if longueur is not None:
        a += ["-t", str(longueur)]
    a += ["-i", str(fichier)]
    if filtre:
        a += ["-af", filtre]
    a += ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(a, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).astype(float)


def chant(numero):
    """L'enregistrement d'origine, telecharge une fois. Il ne sert qu'a etre decode."""
    f = OUT / f"XC{numero}.mp3"
    if not f.exists():
        req = urllib.request.Request(f"https://xeno-canto.org/{numero}/download", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            f.write_bytes(r.read())
    return lit(f).mean(axis=1)


def meilleur(x, d):
    """La fenetre la plus chantante, entre 2 et 8 kHz : un enregistrement commence souvent par du vent."""
    bande = P.bp(x, 4000, q=0.7)
    n = int(d * SR)
    cum = np.cumsum(np.concatenate([[0.0], bande ** 2]))
    pas = SR // 50
    scores = [(cum[i + n] - cum[i], i) for i in range(0, max(1, len(bande) - n), pas)]
    _, i0 = max(scores)
    print(f"  extrait : {i0 / SR:.1f} a {(i0 + n) / SR:.1f} s sur {len(x) / SR:.1f} s")
    return x[i0:i0 + n]


def fondus(n, a, b):
    e = np.ones(n)
    na, nb = int(a * SR), int(b * SR)
    e[:na] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, na))
    e[-nb:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nb))
    return e


def lufs(f):
    t = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(f), "-filter_complex", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", t)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", t)[-1])


def niveau(x, a, b):
    bout = x[int(a * SR):int(b * SR)]
    return 20 * np.log10(np.sqrt((bout ** 2).mean()) + 1e-12)


def main():
    entree, sortie = sys.argv[1], sys.argv[2]
    dv = duree(entree)
    print(f"morceaux : {TOTAL:.2f} s ; video : {dv:.2f} s")
    if abs(dv - TOTAL) > 0.1:
        raise SystemExit("les durees des morceaux ne font pas le film : la partition serait decalee")
    print({k: round(v, 2) for k, v in DEBUT.items()})
    s = P.Score(dur=TOTAL, T60=1.15)
    D = DEBUT

    # Ouverture : le logo se dessine, le nom tombe, l'iris s'ouvre
    bois(s, 0.35, 0.4)
    verre(s, 1.9, 0.3)
    bois(s, 2.7, 0.55)
    souffle(s, 4.9, 0.6, long=True)
    bois(s, 5.35, 0.35)
    # Les photos de la carte, sans insister ; le compteur qui s'arrete sur 199
    for t, tenue in [(7.15, .75), (8.85, .75), (9.3, .75), (11.4, .45), (12.42, .35)]:
        verre(s, t, 0.25, pan=0.3)
        bulle(s, t + tenue + 0.5, 0.25, pan=-0.5)
    grave(s, 12.55, 0.55)

    # Le mur, la case grise, le clic
    souffle(s, D["mur"] + 0.15, 0.45)
    clic(s, D["mur"] + 3.5, pan=-0.5)
    souffle(s, D["mur"] + 3.65, 0.4)
    # La vraie scene : pays, famille, rarete, la carte qui se revele
    verre(s, D["debloque"] + 0.83, 0.25)
    bois(s, D["debloque"] + 2.08, 0.35)
    bois(s, D["debloque"] + 2.92, 0.4)
    grave(s, D["debloque"] + 4.17, 0.7)
    verre(s, D["debloque"] + 4.17, 0.6)
    # La carte se pose, le 200, le recul, le clic sur Trophees
    souffle(s, D["retour"] + 0.15, 0.4)
    bois(s, D["retour"] + 1.04, 0.7, f=170, pan=-0.5)
    verre(s, D["retour"] + 1.04, 0.5, pan=-0.5)
    grave(s, D["retour"] + 1.04, 0.45)
    souffle(s, D["retour"] + 1.64, 0.4)
    clic(s, D["retour"] + 3.86, pan=-0.2)
    # Le trophee : les rayons, le palier, la fenetre
    grave(s, D["trophee"] + 0.45, 0.45)
    verre(s, D["trophee"] + 2.74, 0.6)
    grave(s, D["trophee"] + 2.74, 0.6)
    bulle(s, D["trophee"] + 5.49, 0.4)

    # Le classement : le compteur se pose, Alex remonte en poussant les autres, il arrive en tete
    bois(s, D["classement"] + 1.73, 0.45, pan=-0.3)
    souffle(s, D["classement"] + 2.88, 0.45)
    for t, f in [(3.42, 170), (3.52, 195), (3.615, 220), (3.78, 250)]:
        bois(s, D["classement"] + t, 0.3, f=f, pan=-0.3)
    grave(s, D["classement"] + 4.155, 0.6)
    verre(s, D["classement"] + 4.155, 0.55, pan=-0.3)
    souffle(s, D["classement"] + 5.455, 0.4)
    verre(s, D["classement"] + 8.745, 0.25, pan=-0.3)

    # La fiche : le clic, le tiroir, le defilement, un mois sur deux, l'onglet Sons, la lecture
    clic(s, D["fiche"] + 1.18, pan=-0.5)
    souffle(s, D["fiche"] + 1.23, 0.45, pan=0.4)
    souffle(s, D["fiche"] + 3.23, 0.3, pan=0.4)
    for k in range(0, 12, 2):
        bois(s, D["fiche"] + 4.54 + 0.247 * k, 0.12, f=230, pan=0.2)
    clic(s, D["fiche"] + 7.72, pan=0.5)
    clic(s, D["fiche"] + 9.02, pan=0.1)

    # Le monde : le selecteur, le clic, le mur
    souffle(s, D["monde"] + 0.39, 0.4, pan=0.4)
    souffle(s, D["monde"] + 1.1, 0.25, long=True, pan=0.4)
    clic(s, D["monde"] + 3.5, pan=0.4)
    souffle(s, D["monde"] + 3.65, 0.4, pan=0.4)

    # Le recent : la carte, quelques points, le clic sur un point, le quiz
    souffle(s, D["recent"] + 0.3, 0.35)
    for n in range(6):
        bulle(s, D["recent"] + 1.05 + 1.89 * n / 5, 0.18, pan=-0.4 + 0.12 * n)
    clic(s, D["recent"] + 4.25, pan=-0.6)
    bulle(s, D["recent"] + 4.3, 0.3, pan=-0.6)
    souffle(s, D["recent"] + 7.44, 0.4, pan=0.4)
    clic(s, D["recent"] + 9.96, pan=0.2)
    verre(s, D["recent"] + 10.0, 0.5, pan=0.2)

    # La fin : le logo revient au centre, il se pose ; les credits montent
    souffle(s, D["fin"] + 0.35, 0.5, long=True)
    bois(s, D["fin"] + 1.35, 0.5, f=170)
    grave(s, D["fin"] + 1.35, 0.5)
    souffle(s, D["fin"] + 3.7, 0.25)

    bruitages = s.mix(peak_db=-8.0)
    n = bruitages.shape[0]

    # Les chants : ceux que le film montre, a l'instant ou le lecteur joue
    pistes = np.zeros((n, 2))
    fen = []
    for numero, debut, longueur in [(982627, D["fiche"] + 9.02, 3.3), (807845, D["recent"] + 8.04, 1.92)]:
        ex = meilleur(chant(numero), longueur)
        # a sonie egale, pas a crete egale : a crete egale, le second sortait 6 dB plus fort que le premier
        ex = ex / (np.sqrt((ex ** 2).mean()) + 1e-9) * 10 ** (-19 / 20)
        ex = np.clip(ex, -0.6, 0.6) * fondus(len(ex), 0.1, 0.35)
        i = int(debut * SR)
        m = min(len(ex), n - i)
        pistes[i:i + m] += ex[:m][:, None]
        fen.append((debut, debut + longueur))

    # Le fond : memes reglages que le film precedent. Un vent a de hautes cretes pour une sonie basse : loudnorm, pas un gain
    filtre = "loudnorm=I=-24:TP=-9:LRA=7"
    nappe = lit(NAPPE, 40, TOTAL, filtre)[:n] * 10 ** (-6 / 20)
    feuilles = lit(FEUILLES, 15, TOTAL, filtre)[:n] * 10 ** (-15 / 20)
    fond = np.zeros((n, 2))
    fond[:len(nappe)] += nappe
    fond[:len(feuilles)] += feuilles
    env = np.ones(n)
    # Silence pendant que le logo se dessine : le fond n'arrive qu'avec l'iris qui ouvre la carte, et il repart
    # pendant les credits. Sans ces repos, le film n'etait jamais silencieux (oracle : 1,4 % d'images calmes).
    entree, rampe = int(4.6 * SR), int(1.6 * SR)
    env[:entree] = 0
    env[entree:entree + rampe] = np.linspace(0, 1, rampe)
    fin_fond = int(5 * SR)
    env[-fin_fond:] = np.linspace(1, 0, fin_fond)
    # le fond s'efface sous les chants : -9 dB, en 0,4 s
    baisse = np.ones(n)
    for a, b in fen:
        baisse[int(a * SR):int(b * SR)] = 10 ** (-9 / 20)
    k = int(0.4 * SR)
    baisse = np.convolve(np.pad(baisse, (k, k), mode="edge"), np.ones(k) / k, mode="same")[k:-k]
    fond = fond * (env * baisse)[:, None]

    mix = bruitages + fond + pistes
    t = OUT / "avant-gain.wav"
    ecrit(t, mix)
    i, pk = lufs(t)
    print(f"avant gain : {i} LUFS, crete {pk} dBFS")
    # -19 LUFS. Quelques crêtes de graves bloquaient le gain a -22,6 LUFS : un plafond doux les arrondit a -4 dBFS,
    # sans toucher a ce qui reste sous -8 dBFS.
    gain = -19 - i
    mix = mix * 10 ** (gain / 20)
    seuil, plafond = 10 ** (-8 / 20), 10 ** (-4 / 20)
    a = np.abs(mix)
    haut = a > seuil
    mix[haut] = np.sign(mix[haut]) * (seuil + (plafond - seuil) * np.tanh((a[haut] - seuil) / (plafond - seuil)))
    f = OUT / "bande.wav"
    ecrit(f, mix)
    print("apres gain : LUFS, crete :", lufs(f), "gain", round(gain, 1))
    for nom, a, b in [("repos du logo", 3.6, 4.6), ("sous le chant de la fiche", fen[0][0] + 0.5, fen[0][1] - 0.5), ("sous le chant du quiz", fen[1][0] + 0.4, fen[1][1] - 0.2), ("fond seul, credits", D["fin"] + 5, D["fin"] + 6.5)]:
        print(f"  {nom} : {niveau(mix, a, b):.1f} dB")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", entree, "-i", str(f), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", sortie], check=True)
    print("ecrit", sortie, duree(sortie))


def ecrit(chemin, x):
    import wave
    with wave.open(str(chemin), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


if __name__ == "__main__":
    main()
