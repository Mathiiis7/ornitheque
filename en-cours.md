# En cours - 2026-10-02 (soir)

**Retours de Mathis sur le brouillon v2 (moments 1 et 2), dans l'ordre où on les traite :**
1. **Le logo d'abord, avant toute vidéo** : il n'aime pas vraiment la huppe actuelle. Reprendre le
   travail sur le logo (voir la mémoire « Logo : deux candidats retenus » : 1-oiseau-plat et
   3-tete-sarcelle-clair, dans `assets/logos/candidats/`, non suivis par git).
2. **FAIT le 02/10 : la démo étalée.** 337 points sur 84 départements au lieu de 10. Chaque membre
   a 8 coins dans son département (Indre, Bouches-du-Rhône, Jura, Gironde, Finistère) et 2 dans
   chaque département visité ; l'espèce va là où eBird la donne fréquente ce mois-là
   (`freq_by_region.json`), points tirés dans les vrais contours, nommés par le département.
   `v2-carte.py` relancé (1 349 points lus) ; le film n'est pas encore réassemblé.
3. **La vidéo, après** :
   - la police ne lui plaît pas (aujourd'hui Instrument Serif, via `.onetake/look-ornitheque.json`) :
     proposer 2-3 polices ;
   - les photos d'oiseaux qui surgissent : « top », mais leur cadre est carré alors que les cases du
     Birdydex ont des coins arrondis -> découper la carte avec le même arrondi ;
   - ça manque de rythme : plus de contraste entre moments rapides et pauses.
   Le reste du brouillon lui va.

**Vidéo, déroulé v2 : moments 1 et 2 construits, brouillon 16,8 s** (`.onetake/v2-brouillon.mp4`,
1080p30, sans son, oracle PASS). Phrases choisies par Mathis : colonne A de
`docs/VIDEO-DEROULE-V2.md`. La huppe se dessine facette par facette (59, tirées de l'image
embarquée dans `huppe.svg`), son oeil ouvre un iris sur la carte, la huppe et le nom se rangent
en haut à gauche, 12 points arrivent, 5 photos vont dans le compteur 0 à 212.
Reconstruire : `v2-extrait-logo.py`, `v2-facettes.py` (depuis `.onetake/v2/`), `v2-carte.py`,
`assemble-v2.py`, puis `render.py .onetake/film2/comp.html`.
**La démo n'a que 12 lieux** (1 349 cochages superposés aux mêmes GPS) : pas plus de points sans
inventer des données. Reste : moments 3 à 9, son, crédits, retouches de Mathis sur ce brouillon.

---

# En cours - 2026-10-02

**Sujet du moment : la vidéo de présentation, déroulé v2.** Tout est dans
`docs/VIDEO-DEROULE-V2.md` (9 moments, ~60 s, ouverture sur la huppe qui se dessine, tranché
le 02/10). Prochaines étapes : voir à quoi ressemble le gain d'un trophée, vérifier les
observations récentes dans la démo, proposer 2-3 variantes par phrase, écrire le fil qui relie
les moments. Le compteur validé vient de `outils/onetake/essai-compteur.py`.

---

Sujet précédent, toujours ouvert (cartes GBIF) :

# En cours - 2026-10-01

**Sujet : remplacer les cartes Status & Trends (Cornell interdit l'usage sur un site sans accord
écrit) par nos propres cartes, faites à partir des observations eBird publiées sur GBIF (CC BY 4.0).**

Décisions :
- pas de mail à Cornell pour l'instant (brouillon gardé : `notes-privees/MAIL-CORNELL-STATUS-TRENDS.md`) ;
- méthode validée sur 10 espèces : fréquence = observations de l'espèce / observations de tous
  les oiseaux, par case et par mois, lissée avec les cases voisines. Détail et limites dans
  `docs/sources-cartes.md` ;
- Mathis trouve les cases de 155 km beaucoup trop grosses. Les cartes « à la demande » de GBIF ne
  descendent pas plus bas : il faut le téléchargement SQL.

Où on en est :
- compte GBIF créé par Mathis (identifiant piebavarde49). Je n'utilise jamais son mot de passe :
  c'est LUI qui lance la demande, curl lui demande le mot de passe ;
- requête prête et validée par GBIF : `notes-privees/essai-cartes/gbif-requete.json`
  (espèce × mois × case de 0,25° via GBIF_DMSGCode(900), eBird seul, depuis 2015) ;
- **demande lancée le 2026-10-01 : clé `0006511-260928105237408`** (aussi dans
  `notes-privees/essai-cartes/gbif-cle.txt`), état RUNNING au lancement. L'état se lit sans mot de
  passe sur `https://api.gbif.org/v1/occurrence/download/0006511-260928105237408` ; quand c'est
  SUCCEEDED, le zip est sur `.../download/request/0006511-260928105237408.zip` et le DOI dans l'état ;
- pour relancer une demande : `notes-privees/essai-cartes/lancer-gbif.ps1` (lancé PAR LUI avec
  `powershell -ExecutionPolicy Bypass -File ...`). curl.exe ne marche pas dans le terminal de
  l'appli : la saisie masquée du mot de passe n'arrive jamais.

**Premier essai vide, cause trouvée** : la base SQL de GBIF a changé de classification. Les clés
y sont des codes (Aves = « V2 », pas 212), d'où 0 ligne avec `classKey = 212` (diagnostic
`0006538-260928105237408`). Requête refaite sans classe ni clé GBIF : elle regroupe par
`v_scientificName`, le nom tel qu'eBird le publie, donc déjà en taxonomie eBird (le piège des
sizerins disparaît). Validée par GBIF. L'ancienne requête vide n'est pas gardée.

**Vraie demande réussie : clé `0006562-260928105237408`, DOI `10.15468/dl.c7y4kg`** (celui à citer),
45 881 584 lignes, zip de 1,33 Go, gardé par GBIF jusqu'au 1er avril 2027 (indéfiniment si on cite le DOI).
Zip : `https://api.gbif.org/v1/occurrence/download/request/0006562-260928105237408.zip`.

Reste à faire :
1. récupérer le zip (taille inconnue, peut-être plusieurs centaines de Mo), le traiter en flux ;
2. FAIT le 2026-10-01 : correspondance des noms. Zip téléchargé (`notes-privees/essai-cartes/gbif-ebird.zip`,
   1,33 Go, lu en flux en 55 s par `bilan-gbif.mjs`) : 1 485 098 423 obs, 10 716 noms, 132 954 cases.
   59 noms GBIF suivent une autre version de la taxonomie : tous rattachés dans `gbif-renommages.json`
   (`fige-renommages.mjs` ; les espèces que GBIF sépare et que l'appli range en sous-espèces sont
   ADDITIONNÉES à l'espèce parente). Le rapprochement par épithète seule s'est trompé une fois
   (grive -> Akialoa disparu), corrigé à la main. Bilan : 10 699 espèces vivantes sur 10 994 ont des
   données ; 295 n'en ont pas (`especes-sans-donnees.txt`), surtout les espèces sensibles qu'eBird
   masque (perroquets, chouettes, tétras rares). 61 d'entre elles ont une carte aujourd'hui :
   Décision de Mathis : le plus de cartes possible. 239 des 295 ont des observations dans les AUTRES
   sources GBIF (381 532 obs depuis 2000, `autres-sources.tsv`), dont 51 des 61 qui ont une carte
   aujourd'hui ; les 56 restantes sont quasi disparues ou des séparations récentes, « on verra ».
   La récolte page par page par l'API (`recolte-autres-sources.mjs`) était trop lente (~7 h, pages
   figées) : remplacée par une demande groupée, **clé `0006783-260928105237408`, DOI
   `10.15468/dl.rb9sut`** (à citer aussi), `gbif-autres.zip` (1,9 Mo, 78 792 lignes, mêmes cases
   0,25°, colonnes species, v_scientificName, mois, case, n). Relu par `bilan-autres.mjs` avec
   `gbif-autres-noms.json` : **236 des 239 espèces**, toutes les lignes rattachées. Piège : la base
   SQL range certaines espèces eBird en sous-espèces (« Gygis alba microrhyncha ») : genre + 3e mot.
   Écarts avec le comptage API = observations sans mois (Chouette de l'Oural : 73 000 sur 103 000),
   inutilisables pour les cartes mensuelles. Ces cartes-là sont des cartes de présence : pas de
   correction par l'effort comme pour eBird ;
3. générer cartes annuelles + 12 mois pour toutes les espèces, rendu fondu
   (`notes-privees/essai-cartes/essai-fondu.mjs` comme base), comparer, puis brancher dans l'appli
   et retirer Status & Trends (cartes, animation hebdo, mentions) ;
4. citer le DOI du téléchargement + CC BY 4.0 dans l'À propos.

Page de comparaison : http://localhost:8765/notes-privees/essai-cartes/
