#!/usr/bin/env python3
"""Coleta, via PubChem PUG-View (API pública do NCBI), o texto de 'Effects During Pregnancy and Lactation'
(resumo do LactMed e fichas do MotherToBaby) para cada medicamento da base. Saída: JSON em --saida."""
import json, sys, time, urllib.request, urllib.parse
saida = sys.argv[1]
nomes = json.load(open(__file__.replace('coletar-fontes.py', 'nomes-en.json')))
def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(url, timeout=40) as r: return r.read().decode()
        except Exception as e:
            err = e; time.sleep(1.5)
    return None
def strings(x, out):
    if isinstance(x, dict):
        if 'StringWithMarkup' in x:
            for s in x['StringWithMarkup']: out.append(s['String'])
        for k, v in x.items():
            if k != 'StringWithMarkup': strings(v, out)
    elif isinstance(x, list):
        for v in x: strings(v, out)
res = {}
for pt, en in nomes.items():
    q = urllib.parse.quote(en)
    cid = get(f'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{q}/cids/TXT')
    if not cid: res[pt] = {'en': en, 'erro': 'sem CID'}; continue
    cid = cid.split()[0]
    j = get(f'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON?heading=Effects+During+Pregnancy+and+Lactation')
    if not j: res[pt] = {'en': en, 'cid': cid, 'erro': 'sem seção'}; continue
    out = []; strings(json.loads(j), out)
    res[pt] = {'en': en, 'cid': cid, 'texto': out}
    print(pt, cid, len(out), flush=True)
    time.sleep(0.25)
json.dump(res, open(saida, 'w'), ensure_ascii=False, indent=1)
