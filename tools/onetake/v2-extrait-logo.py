# Film v2, moment 1 : extrait l'image du logo embarquee dans assets/logos/huppe.svg. Lancer depuis la racine, a refaire avant v2-facettes.py ; sorties dans .onetake/v2/.
import re, base64, io
from PIL import Image
s = open('assets/logos/huppe.svg', encoding='utf-8').read()
for i, m in enumerate(re.finditer(r'<image[^>]*?(?:xlink:)?href="data:image/(\w+);base64,([^"]+)"', s)):
    im = Image.open(io.BytesIO(base64.b64decode(m.group(2))))
    print(i, m.group(1), im.size, im.mode)
    im.save('.onetake/v2/svg-img%d.png' % i)
print(re.findall(r'<(?:image|use|g|clipPath|mask)[^>]{0,200}', s)[:12])
