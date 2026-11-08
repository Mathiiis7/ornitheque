// Extrait de Sangster et al. 2022 (Avian Research 13:100027, CC BY-NC-ND) le paragraphe
// « Diagnostic apomorphies » de chaque groupe (sections 4.x), pour les traits du cladogramme.
// Entree : notes-privees/arbre/sources/sangster-2022-brut.txt (pdftotext SANS -layout : l'article
// est en deux colonnes, la mise en page melangeait les colonnes). Lancer depuis la racine.
import fs from 'node:fs';
const t = fs.readFileSync('notes-privees/arbre/sources/sangster-2022-brut.txt', 'utf8').replace(/\r/g, '').replace(/-\n(?=[a-z])/g, '').replace(/ﬁ/g, 'fi');
const re = /\n(4\.\d+)\. ([A-Z][a-z]+)[^\n]*/g;
const titres = [...t.matchAll(re)];
const out = [];
for(let i = 0; i < titres.length; i++){
  const debut = titres[i].index, fin = i + 1 < titres.length ? titres[i + 1].index : t.indexOf('\n5. ', debut) > 0 ? t.indexOf('\n5. ', debut) : t.length;
  const bloc = t.slice(debut, fin);
  const m = bloc.match(/Diagnostic apomorphies:([\s\S]*?)(?=\n(Synonyms|Comments|Registration number|Reference phylogeny|Etymology|Composition)\b|$)/);
  out.push(`== ${titres[i][1]} ${titres[i][2]}\n${m ? m[1].replace(/\s+/g, ' ').trim() : '(paragraphe introuvable)'}`);
}
fs.writeFileSync('notes-privees/arbre/sources/sangster-2022-apomorphies.txt', out.join('\n\n'));
console.log(out.join('\n\n'));
