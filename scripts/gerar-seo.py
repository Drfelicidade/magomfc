#!/usr/bin/env python3
"""Prepara o site para o Google: em cada página .html insere descrição, link canônico e tags de compartilhamento
(entre <!-- seo:inicio --> e <!-- seo:fim -->), e gera sitemap.xml. As descrições vêm dos cartões do index.html.
Rode de novo sempre que criar ou renomear uma página: python3 scripts/gerar-seo.py"""
import glob, html, json, os, re, datetime
SITE = 'https://magomfc.com.br'  # trocar aqui se o site ganhar domínio próprio
MARCA = 'Mago MFC'
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
idx = open('index.html', encoding='utf-8').read()
# descrição de cada página = texto do <p> do cartão que aponta para ela na página inicial
DESC = {h: html.unescape(re.sub(r'\s+', ' ', p).strip()) for h, p in
        re.findall(r'<a href="([^"]+\.html)"[^>]*>\s*<h3[^>]*>.*?</h3>\s*<p[^>]*>(.*?)</p>', idx, re.S)}
attr = lambda s: html.escape(s, quote=True)
hoje = datetime.date.today().isoformat()
urls = []
for f in sorted(glob.glob('*.html')):
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'\n?[ \t]*<!-- seo:inicio -->.*?<!-- seo:fim -->', '', s, flags=re.S)
    s = s.replace('<html lang="pt-PT">', '<html lang="pt-BR">')
    titulo = html.unescape(re.search(r'<title>(.*?)</title>', s, re.S).group(1).strip())
    nome = titulo.removesuffix(f' | {MARCA}')
    if MARCA not in titulo:
        titulo = f'{titulo} | {MARCA}'
        s = re.sub(r'<title>.*?</title>', lambda m: f'<title>{attr(titulo)}</title>', s, count=1, flags=re.S)
    url = SITE + '/' if f == 'index.html' else f'{SITE}/{f}'
    m = re.search(r'<meta name="description" content="([^"]*)"', s)
    desc = html.unescape(m.group(1)) if m else DESC.get(f, f'{nome}: ferramenta de apoio à prática clínica na Atenção Primária à Saúde.')
    tags = [] if m else [f'<meta name="description" content="{attr(desc)}">']
    tags += [f'<link rel="canonical" href="{url}">',
             '<meta property="og:type" content="website">',
             f'<meta property="og:site_name" content="{MARCA}">',
             '<meta property="og:locale" content="pt_BR">',
             f'<meta property="og:title" content="{attr(titulo)}">',
             f'<meta property="og:description" content="{attr(desc)}">',
             f'<meta property="og:url" content="{url}">']
    if f == 'index.html':
        tags.append('<script type="application/ld+json">' + json.dumps({
            '@context': 'https://schema.org', '@type': 'WebSite', 'name': MARCA, 'alternateName': 'MagoMFC',
            'url': SITE + '/', 'inLanguage': 'pt-BR', 'description': desc}, ensure_ascii=False) + '</script>')
    bloco = '\n    <!-- seo:inicio -->\n' + ''.join(f'    {t}\n' for t in tags) + '    <!-- seo:fim -->'
    s = re.sub(r'(<title>.*?</title>)', lambda m: m.group(1) + bloco, s, count=1, flags=re.S)
    open(f, 'w', encoding='utf-8').write(s)
    # páginas auxiliares de download não entram no sitemap
    if f == 'index.html' or f in DESC:
        urls.append((url, '1.0' if f == 'index.html' else '0.8'))
with open('sitemap.xml', 'w', encoding='utf-8') as out:
    out.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u, pr in urls:
        out.write(f'  <url><loc>{u}</loc><lastmod>{hoje}</lastmod><priority>{pr}</priority></url>\n')
    out.write('</urlset>\n')
print(f'{len(glob.glob("*.html"))} páginas atualizadas, {len(urls)} no sitemap.xml')
