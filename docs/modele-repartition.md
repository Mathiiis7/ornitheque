# Notre propre modèle de répartition : le plan

Décidé par Mathis le 2026-10-21 : après le téléchargement GBIF « toutes bases » et la teinte iNaturalist
temporaire, **essayer** des cartes pleines, sur le principe de Status & Trends, mais publiables.
Rien n'est commencé ; ce document dit ce qu'il faudra, et ce qui reste à vérifier.

## Le principe, sans jargon

Une carte d'observations reste vide là où personne n'observe. Un modèle apprend, sur les cases où il y a
des observateurs, dans quels milieux l'oiseau est présent ou absent : climat, végétation, relief. Il devine
ensuite les cases où personne ne va, d'après leur milieu. C'est ce que fait Status & Trends avec eBird,
et c'est pour ça que ses cartes n'ont pas de trous.

Deux garde-fous, tirés de ce qu'on a déjà vu :
- **ne pas prédire n'importe où** : l'aire iNaturalist remplit le Sahara pour le bulbul parce que le modèle
  extrapole loin des observations. On limitera la prédiction à une zone plausible (par exemple l'aire
  iNaturalist élargie, ou les régions où l'espèce a déjà été vue), et on montrera ce qui est estimé ;
- **apprendre les absences sur des listes complètes** : une case visitée sans l'espèce ne dit quelque chose
  que si l'observateur notait tout. eBird, SABAP2, le Nigeria et le Kenya donnent ces listes ; les
  observations isolées (photos) ne servent qu'à la présence.

## Les données

| Quoi | Source | Licence (lue à la source le 2026-10-21) | Taille |
|---|---|---|---|
| Observations | GBIF toutes bases, DOI 10.15468/dl.vnrtqk | CC BY-NC 4.0 (ensemble) | 2,5 Go, déjà demandé |
| Climat | CHELSA V2.1, moyennes 1981-2010, 19 variables « bio » | CC0 1.0 (page du jeu sur chelsa-climate.org) | 115 Mo (bio1) à 655 Mo (bio12) par variable, mesuré ; on n'en prendrait que 6 à 8 |
| Végétation | MODIS MCD12C1 v6.1, occupation du sol, 0,05° | sans restriction (NASA, à relire sur la page LP DAAC avant de télécharger) | à relever |
| Relief | ETOPO 2022, NOAA, 60 secondes d'arc | **pas trouvée** : à vérifier avant de s'en servir | à relever |
| Écarté | WorldClim | redistribution interdite | - |

Chaque téléchargement demandera l'accord de Mathis, avec le nom du fichier et sa taille.

## Les étapes

1. **Essai sur les 23 espèces** du rapport `docs/cartes-combler-les-trous.md` (bulbul, corbeau pie,
   tisserin, mésange, huppe, migrateurs...) : un modèle par espèce, à l'année d'abord, puis par mois pour les
   migrateurs. Comparaison à l'œil avec nos observations et l'aire iNaturalist, sur une maquette comme celles
   de `notes-privees/maquettes/`.
2. **Mesurer le temps de calcul** sur ce portable pendant l'essai, et seulement ensuite estimer le tout
   (10 896 cartes). Aujourd'hui : inconnu.
3. **Choisir l'affichage avec Mathis** : la prédiction en couleurs comme une vraie fréquence, ou en teinte
   à part « estimé par un modèle ». La teinte iNaturalist disparaît alors.
4. **Tout générer**, publier dans `ornitheque-data` d'abord, puis ce dépôt.

## Les risques connus

- Les oiseaux rares, avec très peu de cases de présence : le modèle n'apprend rien de solide. Garder alors la
  carte d'observations seule.
- Les oiseaux marins : climat et végétation terrestres ne disent rien de la mer. À traiter à part.
- Les saisons : une carte par mois demande assez d'observations chaque mois ; sinon, l'année seule.
- La durée : estimée à une ou deux semaines de travail en tout.
