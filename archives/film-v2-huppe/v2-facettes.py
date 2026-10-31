# Film v2, moment 1 : decoupe le logo en facettes (facettes.json). Lancer depuis .onetake/v2/ apres v2-extrait-logo.py.
# Decoupe le logo de la huppe en facettes (une par aplat de couleur) pour le dessiner trait par trait.
import numpy as np, cv2, json
from PIL import Image
rgb = np.array(Image.open('svg-img1.png').convert('RGB'))
a = np.array(Image.open('svg-img0.png').convert('L'))
rgba = np.dstack([rgb, a]); Image.fromarray(rgba).save('huppe-haute.png')
print(rgba.shape, np.unique(a)[:5], (a>128).mean())
# palette : quantification k-means sur les pixels opaques
px = rgb[a > 200].reshape(-1, 3).astype(np.float32)
K = 9
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
_, lab, cen = cv2.kmeans(px[::7], K, None, crit, 3, cv2.KMEANS_PP_CENTERS)
print(np.round(cen).astype(int).tolist())

# --- facettes -----------------------------------------------------------------------------
cen = cen.astype(np.float32)
H, W = a.shape
d = ((rgb.reshape(-1, 1, 3).astype(np.float32) - cen[None]) ** 2).sum(2)
idx = d.argmin(1).reshape(H, W).astype(np.uint8)
opaque = (a > 128)
idx = cv2.medianBlur(idx, 5)
facettes = []
for k in range(K):
    m = ((idx == k) & opaque).astype(np.uint8)
    n, cc, st, ce = cv2.connectedComponentsWithStats(m, connectivity=8)
    for j in range(1, n):
        if st[j, 4] < 160: continue
        mm = (cc == j).astype(np.uint8)
        cs, _ = cv2.findContours(mm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cs, key=cv2.contourArea)
        eps = 0.0035 * cv2.arcLength(c, True)
        ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
        if len(ap) < 3: continue
        col = '#%02x%02x%02x' % tuple(int(v) for v in cen[k])
        facettes.append({'c': col, 'p': ap.tolist(), 'a': int(st[j, 4]), 'cx': float(ce[j][0]), 'cy': float(ce[j][1])})
print(len(facettes), 'facettes')
# apercu : on repeint les facettes sur fond blanc pour juger la fidelite
img = np.full((H, W, 3), 255, np.uint8)
for f in sorted(facettes, key=lambda f: -f['a']):
    rgbc = tuple(int(f['c'][i:i+2], 16) for i in (1, 3, 5))
    cv2.fillPoly(img, [np.array(f['p'], np.int32)], rgbc[::-1])
cv2.imwrite('apercu-facettes.png', img)
json.dump({'w': W, 'h': H, 'f': facettes}, open('facettes.json', 'w'))
