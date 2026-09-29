#!/usr/bin/env python3
"""Gera assets/tema-escuro.css: remapeia as utilidades claras do Tailwind (CDN) para o tema escuro
automático (prefers-color-scheme: dark). Rode: python3 scripts/gerar-tema-escuro.py"""
HUES = {'red':0,'orange':25,'amber':40,'yellow':50,'lime':85,'green':140,'emerald':160,'teal':175,
        'cyan':190,'sky':200,'blue':220,'indigo':240,'violet':262,'purple':275,'fuchsia':295,'pink':330,'rose':350}
# (sat%, lum%) por tom, no escuro
BG   = {50:(30,13), 100:(32,17), 200:(32,22), 300:(30,28)}
BGH  = {50:(30,13), 100:(32,17), 200:(32,22), 300:(30,28)}
TEXT = {900:(70,86), 800:(70,82), 700:(65,78), 600:(70,70), 500:(65,65)}
BORD = {100:(25,24), 200:(25,28), 300:(25,34)}
NEUTRO_BG = {'white':'#182329','gray-50':'#131d22','gray-100':'#0f171b','gray-200':'#22303a','gray-300':'#2f4049'}
NEUTRO_TX = {'gray-900':'#eef3f6','gray-800':'#e6edf1','gray-700':'#cfd9df','gray-600':'#b4c1ca','gray-500':'#98a8b3','gray-400':'#7d8f9b'}
NEUTRO_BD = {'gray-100':'#22303a','gray-200':'#2a3a43','gray-300':'#3a4d58','gray-400':'#4a5f6b'}
hsl = lambda h,s,l: f'hsl({h} {s}% {l}%)'
r = []
def rule(sel, prop, val): r.append(f'  {sel}{{{prop}:{val} !important}}')
for n,c in NEUTRO_BG.items():
    rule(f'.bg-{n}', 'background-color', c); rule(f'.hover\\:bg-{n}:hover', 'background-color', c)
for n,c in NEUTRO_TX.items():
    rule(f'.text-{n}', 'color', c)
for n,c in NEUTRO_BD.items():
    rule(f'.border-{n}', 'border-color', c); rule(f'.divide-{n} > :not([hidden]) ~ :not([hidden])', 'border-color', c)
for h,deg in HUES.items():
    for t,(s,l) in BG.items():
        rule(f'.bg-{h}-{t}', 'background-color', hsl(deg,s,l))
        rule(f'.hover\\:bg-{h}-{t}:hover', 'background-color', hsl(deg,s,min(l+4,40)))
    for t,(s,l) in TEXT.items():
        rule(f'.text-{h}-{t}', 'color', hsl(deg,s,l))
    for t,(s,l) in BORD.items():
        rule(f'.border-{h}-{t}', 'border-color', hsl(deg,s,l))
        rule(f'.ring-{h}-{t}', '--tw-ring-color', hsl(deg,s,l))
# variantes translúcidas (bg-red-50/30, bg-white/60...) sobre fundos claros
for h,deg in HUES.items():
    for t,(s,l) in BG.items():
        if t <= 200: rule(f'[class*="bg-{h}-{t}/"]', 'background-color', f'hsl({deg} {s}% {l}% / .6)')
for t in (50,100,200):
    rule(f'[class*="bg-gray-{t}/"]', 'background-color', 'rgb(34 48 58 / .5)')
rule('[class*="bg-white/"]', 'background-color', 'rgb(24 35 41 / .7)')
rule('.border-black\\/10', 'border-color', 'rgb(255 255 255 / .12)')
css = '''/* GERADO por scripts/gerar-tema-escuro.py: não edite à mão.
   Tema escuro automático para as páginas com Tailwind (CDN). */
:root{color-scheme:light dark}
@media (prefers-color-scheme:dark){
  body{background-color:#0f171b !important;color:#e6edf1}
  input,select,textarea{background-color:#10181d !important;color:#e6edf1 !important;border-color:#3a4d58 !important}
  input::placeholder,textarea::placeholder{color:#7d8f9b !important}
  option{background:#182329;color:#e6edf1}
  hr{border-color:#2a3a43}
  table{color:inherit}
  a:not([class]){color:#7cc4ff}
''' + '\n'.join(r) + '\n}\n'
open(__file__.replace('scripts/gerar-tema-escuro.py','assets/tema-escuro.css'),'w').write(css)
print(len(r),'regras')
