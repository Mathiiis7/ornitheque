# Rend la page du PDF de Mathis en PNG et en extrait les images, avec leur place sur la page.
import sys, json, warnings
warnings.filterwarnings('ignore')
sys.path.append('C:/Users/mathi/AppData/Roaming/Python/Python314/site-packages')   # PyMuPDF, installe pour l'utilisateur
import fitz
src, out = sys.argv[1], sys.argv[2]
doc = fitz.open(src)
page = doc[0]
page.get_pixmap(dpi=144, alpha=True).save(out + '/page.png')
infos = []
for i, im in enumerate(page.get_images(full=True)):
    xref, smask = im[0], im[1]
    rects = page.get_image_rects(xref)
    pix = fitz.Pixmap(doc, xref)
    if smask:
        m = fitz.Pixmap(doc, smask)
        pix = fitz.Pixmap(pix, m)
    if pix.n - pix.alpha > 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    nom = f'{out}/img-{i:02d}.png'
    pix.save(nom)
    infos.append({'i': i, 'xref': xref, 'w': pix.width, 'h': pix.height, 'rects': [[round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1)] for r in rects]})
print(json.dumps({'page': [page.rect.width, page.rect.height], 'images': infos}, indent=0))
