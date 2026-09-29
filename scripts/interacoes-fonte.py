#!/usr/bin/env python3
"""Gera data/interacoes.json. Uso: python3 scripts/interacoes-fonte.py
Fármacos: nome | classes | nome em inglês (para conferência em bulas DailyMed).
Regras: (A, B, gravidade, mecanismo/efeito, conduta). A e B são nomes de fármaco ou classe.
Gravidade: c = contraindicada, g = grave (evitar ou ajustar/monitorar de perto), m = moderada (monitorar)."""
import json, sys
F = """varfarina|vka|warfarin
rivaroxabana|doac,xa|rivaroxaban
apixabana|doac,xa|apixaban
dabigatrana|doac|dabigatran
AAS|aas,antiplaq|aspirin
clopidogrel|antiplaq|clopidogrel
ibuprofeno|aine|ibuprofen
diclofenaco|aine|diclofenac
naproxeno|aine|naproxen
meloxicam|aine|meloxicam
cetoprofeno|aine|ketoprofen
nimesulida|aine|nimesulide
enalapril|ieca|enalapril
captopril|ieca|captopril
lisinopril|ieca|lisinopril
ramipril|ieca|ramipril
losartana|bra|losartan
valsartana|bra|valsartan
candesartana|bra|candesartan
olmesartana|bra|olmesartan
espironolactona|poupk|spironolactone
hidroclorotiazida|tiazidico|hydrochlorothiazide
clortalidona|tiazidico|chlorthalidone
indapamida|tiazidico|indapamide
furosemida|alca|furosemide
metoprolol|betabloq|metoprolol
atenolol|betabloq|atenolol
propranolol|betabloq|propranolol
carvedilol|betabloq|carvedilol
bisoprolol|betabloq|bisoprolol
verapamil|bccnd|verapamil
diltiazem|bccnd|diltiazem
anlodipino||amlodipine
digoxina||digoxin
amiodarona|qt|amiodarone
sinvastatina|estatina|simvastatin
atorvastatina|estatina|atorvastatin
rosuvastatina|estatina|rosuvastatin
genfibrozila||gemfibrozil
metformina||metformin
glibenclamida|sulfonilureia|glyburide
glimepirida|sulfonilureia|glimepiride
gliclazida|sulfonilureia|gliclazide
insulina|hipoglic|insulin
fluoxetina|isrs,cyp2d6|fluoxetine
paroxetina|isrs,cyp2d6|paroxetine
sertralina|isrs|sertraline
citalopram|isrs,qt|citalopram
escitalopram|isrs,qt|escitalopram
venlafaxina|irsn|venlafaxine
duloxetina|irsn|duloxetine
amitriptilina|adt,qt|amitriptyline
nortriptilina|adt|nortriptyline
trazodona||trazodone
tramadol|opioide|tramadol
codeína|opioide|codeine
morfina|opioide|morphine
alprazolam|benzo|alprazolam
diazepam|benzo|diazepam
clonazepam|benzo|clonazepam
lorazepam|benzo|lorazepam
zolpidem||zolpidem
gabapentina||gabapentin
carbamazepina|indutor|carbamazepine
fenitoína|indutor|phenytoin
fenobarbital|indutor|phenobarbital
valproato||valproate
lamotrigina||lamotrigine
lítio||lithium
haloperidol|qt|haloperidol
risperidona||risperidone
quetiapina|qt|quetiapine
omeprazol|ibp|omeprazole
esomeprazol|ibp|esomeprazole
pantoprazol|ibp|pantoprazole
claritromicina|macrolideo,qt|clarithromycin
eritromicina|macrolideo,qt|erythromycin
azitromicina|qt|azithromycin
ciprofloxacino|quinolona,qt|ciprofloxacin
levofloxacino|quinolona,qt|levofloxacin
metronidazol||metronidazole
sulfametoxazol + trimetoprima|smx|sulfamethoxazole
fluconazol|qt|fluconazole
cetoconazol|azol|ketoconazole
itraconazol|azol|itraconazole
rifampicina|indutor|rifampin
levotiroxina||levothyroxine
carbonato de cálcio|quelante|calcium carbonate
sulfato ferroso|quelante|ferrous sulfate
alopurinol||allopurinol
colchicina||colchicine
azatioprina||azathioprine
metotrexato||methotrexate
prednisona|corticoide|prednisone
sildenafila||sildenafil
isossorbida|nitrato|isosorbide
sumatriptana||sumatriptan
ondansetrona|qt|ondansetron
metoclopramida||metoclopramide
tamoxifeno||tamoxifen
anticoncepcional oral||ethinyl estradiol"""
R = [
# anticoagulantes / antiagregantes
("varfarina","aine","g","Efeito antiplaquetário e lesão da mucosa GI somam-se ao efeito anticoagulante.","Evitar. Se inevitável: menor dose/tempo, IBP e controle de INR; preferir paracetamol."),
("varfarina","AAS","g","Somam-se os efeitos sobre hemostasia; risco de sangramento maior.","Associar apenas com indicação clara (ex.: prótese valvar mecânica, SCA recente); considerar IBP."),
("varfarina","claritromicina","g","Aumenta o INR (redução do metabolismo e da flora produtora de vitamina K).","Evitar ou monitorar INR em 3–5 dias; azitromicina tem menor interação."),
("varfarina","eritromicina","g","Aumenta o INR.","Evitar ou monitorar INR de perto."),
("varfarina","quinolona","g","Aumenta o INR (flora intestinal e possível inibição do metabolismo).","Monitorar INR durante e após o curso."),
("varfarina","metronidazol","g","Inibe o metabolismo da varfarina (CYP2C9): aumento importante do INR.","Evitar; se necessário, reduzir a dose de varfarina e checar INR em 3–5 dias."),
("varfarina","smx","g","Inibe CYP2C9 e desloca a varfarina da albumina: INR ↑ e sangramento.","Evitar; se necessário, monitorar INR em 3–5 dias."),
("varfarina","fluconazol","g","Inibe CYP2C9: INR ↑ marcado.","Evitar ou reduzir a dose de varfarina e monitorar INR."),
("varfarina","amiodarona","g","Inibe CYP2C9/3A4/1A2: INR ↑ (efeito se instala em semanas e persiste por meses).","Reduzir a dose de varfarina em ~30–50% ao iniciar e monitorar INR semanalmente."),
("varfarina","rifampicina","g","Indução enzimática: INR ↓ com risco de falha anticoagulante.","Monitorar INR frequentemente; doses maiores de varfarina podem ser necessárias."),
("varfarina","carbamazepina","g","Indução enzimática: reduz o efeito da varfarina.","Monitorar INR; ajustar dose."),
("varfarina","fenobarbital","g","Indução enzimática: reduz o efeito da varfarina.","Monitorar INR; ajustar dose."),
("varfarina","isrs","m","ISRS prejudicam a agregação plaquetária: mais sangramento.","Monitorar sinais de sangramento; considerar IBP."),
("varfarina","tamoxifeno","g","Potencializa a anticoagulação (INR ↑).","Evitar; se necessário, monitorar INR de perto."),
("varfarina","corticoide","m","Pode aumentar o INR e o risco de sangramento GI.","Monitorar INR."),
("doac","aine","g","Somam-se efeitos sobre hemostasia e lesão GI.","Evitar; usar paracetamol."),
("doac","aas","g","Aumenta o risco de sangramento.","Somente com indicação (ex.: SCA/stent); reavaliar necessidade."),
("xa","azol","g","Inibição de CYP3A4 e P-gp (cetoconazol, itraconazol): aumenta a exposição ao inibidor do fator Xa.","Evitar a associação (bula de rivaroxabana e apixabana)."),
("doac","indutor","g","Indução de CYP3A4/P-gp reduz a exposição ao anticoagulante oral direto.","Evitar; risco de falha anticoagulante."),
("dabigatrana","verapamil","m","Inibição de P-gp aumenta o nível de dabigatrana.","Administrar dabigatrana ≥ 2 h antes do verapamil; considerar dose menor conforme bula."),
("dabigatrana","amiodarona","m","Inibição de P-gp aumenta a exposição a dabigatrana.","Monitorar sangramento, especialmente com disfunção renal."),
("AAS","aine","m","Ibuprofeno e outros AINEs competem pelo sítio da COX-1 e podem reduzir o efeito antiplaquetário do AAS; somam risco de sangramento GI.","Se necessário AINE: tomar o AAS ≥ 30 min antes ou 8 h depois do ibuprofeno; preferir paracetamol."),
("clopidogrel","omeprazol","m","Inibição de CYP2C19 reduz a ativação do clopidogrel.","Evitar omeprazol/esomeprazol; preferir pantoprazol."),
("clopidogrel","esomeprazol","m","Inibição de CYP2C19 reduz a ativação do clopidogrel.","Preferir pantoprazol."),
("antiplaq","aine","m","Aumenta risco de sangramento GI.","Usar menor dose/tempo e considerar IBP."),
# renal / cardio
("ieca","poupk","g","Somam-se retenção de potássio: risco de hipercalemia, sobretudo com DRC, diabetes e idosos.","Monitorar K e creatinina 1 semana após início/ajuste; evitar suplemento de K."),
("bra","poupk","g","Soma de retenção de potássio: risco de hipercalemia.","Monitorar K e creatinina 1 semana após início/ajuste."),
("ieca","aine","g","AINE reduz prostaglandinas renais: ↓ efeito anti-hipertensivo e risco de lesão renal aguda (mais com diurético: “tripla ameaça”).","Evitar em idosos, DRC e desidratação; hidratação e checar creatinina/K."),
("bra","aine","g","Igual a IECA: risco de LRA e ↓ efeito anti-hipertensivo.","Evitar; checar creatinina/K."),
("ieca","bra","g","Bloqueio duplo do SRAA: hipercalemia, hipotensão e LRA sem benefício adicional.","Evitar a associação."),
("ieca","smx","g","Hipercalemia (trimetoprima bloqueia canal de sódio distal), sobretudo em idosos e DRC.","Evitar; se necessário, checar K em 3–7 dias."),
("bra","smx","g","Hipercalemia.","Evitar; checar K em 3–7 dias."),
("poupk","smx","g","Hipercalemia (efeito aditivo).","Evitar; se necessário, checar K em 3–7 dias."),
("ieca","lítio","g","IECA reduz a excreção de lítio: litemia ↑ e toxicidade.","Evitar ou monitorar litemia semanalmente ao iniciar/ajustar."),
("bra","lítio","g","Reduz a excreção de lítio: toxicidade.","Monitorar litemia."),
("aine","lítio","g","AINE reduz o clearance renal de lítio: litemia ↑.","Evitar (paracetamol é mais seguro); monitorar litemia."),
("tiazidico","lítio","g","Tiazídicos aumentam a reabsorção proximal de lítio: litemia ↑ 25–40%.","Evitar ou reduzir a dose de lítio e monitorar litemia."),
("metronidazol","lítio","m","Pode elevar a litemia.","Monitorar litemia e sinais de toxicidade."),
("aine","tiazidico","m","AINE reduz o efeito diurético e anti-hipertensivo e aumenta risco renal.","Evitar uso prolongado; monitorar PA e creatinina."),
("aine","alca","m","AINE reduz o efeito da furosemida e aumenta risco renal.","Evitar uso prolongado; monitorar."),
("aine","corticoide","m","Soma-se lesão da mucosa GI: risco de úlcera e sangramento.","Considerar IBP; menor dose/tempo."),
("aine","isrs","m","Ambos aumentam o risco de sangramento GI.","Considerar IBP; preferir paracetamol."),
("digoxina","amiodarona","g","Amiodarona reduz o clearance de digoxina (níveis podem dobrar).","Reduzir a dose de digoxina em ~50% e monitorar nível sérico/ECG."),
("digoxina","verapamil","g","Verapamil eleva a digoxinemia (30–50%) e soma bradicardia/bloqueio AV.","Reduzir a dose de digoxina e monitorar nível e frequência cardíaca."),
("digoxina","claritromicina","g","Inibição de P-gp/flora intestinal aumenta a digoxinemia: intoxicação.","Evitar ou monitorar nível; preferir azitromicina com cautela."),
("digoxina","eritromicina","g","Aumenta a digoxinemia.","Evitar ou monitorar nível."),
("digoxina","alca","m","Hipopotassemia e hipomagnesemia aumentam a toxicidade digitálica.","Monitorar K e Mg."),
("digoxina","tiazidico","m","Hipopotassemia aumenta a toxicidade digitálica.","Monitorar K."),
("betabloq","bccnd","g","Bradicardia, bloqueio AV e depressão da contratilidade somadas.","Evitar a associação (verapamil especialmente); se necessária, monitorar ECG e FC."),
("betabloq","amiodarona","g","Bradicardia e bloqueio AV somados; amiodarona inibe CYP2D6.","Monitorar FC/ECG."),
("propranolol","insulina","m","Betabloqueador mascara sintomas adrenérgicos de hipoglicemia.","Orientar automonitorização; preferir cardiosseletivos."),
("propranolol","sulfonilureia","m","Mascara sintomas de hipoglicemia.","Orientar automonitorização; preferir cardiosseletivos."),
("cyp2d6","betabloq","m","Fluoxetina/paroxetina inibem CYP2D6 e elevam metoprolol e carvedilol (bradicardia).","Monitorar FC e PA; considerar dose menor."),
# estatinas
("sinvastatina","amiodarona","g","Aumenta o risco de miopatia/rabdomiólise.","Não exceder sinvastatina 20 mg/dia."),
("sinvastatina","bccnd","g","Inibição de CYP3A4 eleva sinvastatina: miopatia.","Limitar sinvastatina a 10 mg (diltiazem/verapamil) ou trocar por rosuvastatina/pravastatina."),
("sinvastatina","anlodipino","m","Anlodipino aumenta a exposição à sinvastatina.","Não exceder sinvastatina 20 mg/dia."),
("sinvastatina","claritromicina","c","Inibição forte de CYP3A4: rabdomiólise.","Suspender a sinvastatina durante o macrolídeo."),
("sinvastatina","eritromicina","c","Inibição de CYP3A4: rabdomiólise.","Suspender a sinvastatina durante o curso."),
("sinvastatina","azol","c","Inibição forte de CYP3A4 (itraconazol, cetoconazol): rabdomiólise.","Contraindicada; suspender a estatina durante o antifúngico."),
("sinvastatina","fluconazol","g","Inibição de CYP3A4: risco de miopatia.","Evitar ou suspender temporariamente a sinvastatina."),
("atorvastatina","claritromicina","g","Aumenta exposição à atorvastatina.","Limitar atorvastatina a 20 mg/dia ou suspender durante o curso."),
("atorvastatina","azol","g","Inibição de CYP3A4 (itraconazol): miopatia.","Limitar atorvastatina a 20 mg/dia (itraconazol) ou suspender."),
("estatina","genfibrozila","g","Genfibrozila aumenta os níveis de estatinas: rabdomiólise.","Evitar; se necessário fibrato, preferir fenofibrato."),
("estatina","colchicina","m","Soma-se toxicidade muscular.","Monitorar dor/fraqueza muscular e CK."),
# neuro / psiquiatria
("isrs","tramadol","g","Síndrome serotoninérgica e ↓ limiar convulsivo; fluoxetina/paroxetina ainda inibem CYP2D6 (menos analgesia).","Evitar; se necessário, dose baixa e vigiar sintomas serotoninérgicos."),
("irsn","tramadol","g","Risco de síndrome serotoninérgica e convulsões.","Evitar ou usar com cautela."),
("adt","tramadol","g","Síndrome serotoninérgica e convulsões.","Evitar ou usar com cautela."),
("cyp2d6","codeína","m","Inibição de CYP2D6 impede a conversão em morfina: analgesia ↓.","Preferir outro analgésico."),
("cyp2d6","tramadol","m","Menor formação do metabólito ativo: analgesia ↓ e mais efeito serotoninérgico.","Preferir outro analgésico."),
("cyp2d6","tamoxifeno","g","Redução do endoxifeno (metabólito ativo): pode reduzir a eficácia do tamoxifeno.","Evitar fluoxetina/paroxetina; preferir sertralina/venlafaxina/escitalopram."),
("isrs","sumatriptana","m","Risco teórico de síndrome serotoninérgica.","Baixo risco na prática; orientar sinais."),
("cyp2d6","adt","m","Fluoxetina/paroxetina elevam níveis de ADT (toxicidade anticolinérgica/cardíaca).","Considerar dose menor de ADT e ECG."),
("isrs","trazodona","m","Aumenta risco de síndrome serotoninérgica e sedação.","Doses baixas de trazodona; vigiar sintomas."),
("qt","qt","m","Somam-se prolongamento do intervalo QT e risco de torsades de pointes (amiodarona, citalopram, escitalopram, haloperidol, quetiapina, ondansetrona, macrolídeos, quinolonas, fluconazol, amitriptilina).","Evitar combinar vários; corrigir K/Mg; ECG basal em risco (idosos, cardiopatas, uso de diuréticos)."),
("opioide","benzo","g","Depressão respiratória, sedação profunda e morte (alerta da FDA).","Evitar; se inevitável, menor dose e tempo, e orientar cuidadores."),
("opioide","zolpidem","m","Somam-se sedação e depressão respiratória.","Evitar ou reduzir doses."),
("opioide","gabapentina","m","Gabapentinoides somam depressão respiratória e sedação com opioides.","Menor dose; cautela em idosos e DPOC."),
("benzo","zolpidem","m","Sedação aditiva, quedas e confusão, sobretudo em idosos.","Evitar associação."),
("benzo","fenobarbital","m","Sedação aditiva.","Monitorar sedação e respiração."),
("alprazolam","azol","g","Inibição de CYP3A4 eleva alprazolam (cetoconazol/itraconazol contraindicados na bula).","Evitar ou reduzir a dose de alprazolam."),
("alprazolam","claritromicina","m","Inibição de CYP3A4 aumenta alprazolam.","Reduzir dose ou monitorar sedação."),
("carbamazepina","claritromicina","g","Inibição de CYP3A4 eleva carbamazepina: toxicidade (ataxia, diplopia).","Evitar; usar azitromicina."),
("carbamazepina","eritromicina","g","Eleva carbamazepina.","Evitar."),
("carbamazepina","lamotrigina","m","Indução reduz o nível de lamotrigina.","Ajustar dose de lamotrigina."),
("carbamazepina","tramadol","m","Indução reduz tramadol e aumenta risco de convulsões.","Evitar."),
("valproato","lamotrigina","g","Valproato dobra o nível de lamotrigina: risco de rash grave (Stevens-Johnson).","Reduzir a dose de lamotrigina para cerca da metade e titular lentamente."),
("fenitoína","fluconazol","g","Fluconazol inibe o metabolismo da fenitoína: toxicidade.","Monitorar nível de fenitoína e reduzir dose."),
("lamotrigina","anticoncepcional oral","m","Estrogênio reduz o nível de lamotrigina (~50%) e há oscilação na pausa do ciclo.","Ajustar lamotrigina; preferir método sem estrogênio."),
("indutor","anticoncepcional oral","g","Indução enzimática reduz o etinilestradiol/progestágeno: falha contraceptiva.","Usar método não hormonal, DIU ou injetável de depósito (DMPA); preferir DIU de cobre."),
("haloperidol","metoclopramida","m","Somam-se efeitos extrapiramidais.","Evitar associação."),
("risperidona","metoclopramida","m","Somam-se efeitos extrapiramidais.","Evitar associação."),
("cyp2d6","risperidona","m","Fluoxetina/paroxetina elevam risperidona.","Monitorar efeitos extrapiramidais; considerar dose menor."),
# endócrino
("sulfonilureia","fluconazol","g","Inibição de CYP2C9 eleva sulfonilureia: hipoglicemia prolongada.","Evitar ou reduzir dose e monitorar glicemia."),
("sulfonilureia","smx","g","Aumenta o efeito hipoglicemiante.","Monitorar glicemia; evitar em idosos."),
("sulfonilureia","quinolona","m","Disglicemia (hipo e hiperglicemia) com fluoroquinolonas.","Monitorar glicemia."),
("hipoglic","corticoide","m","Corticoides elevam a glicemia e reduzem o efeito dos antidiabéticos.","Monitorar glicemia e ajustar."),
("metformina","corticoide","m","Corticoide aumenta glicemia.","Monitorar glicemia."),
("levotiroxina","quelante","m","Cálcio e ferro reduzem a absorção de levotiroxina.","Separar por ≥ 4 horas."),
("levotiroxina","ibp","m","Redução da acidez gástrica pode reduzir a absorção de levotiroxina.","Monitorar TSH ao iniciar/suspender o IBP."),
("levotiroxina","indutor","m","Indução acelera o metabolismo da levotiroxina.","Monitorar TSH e ajustar."),
# infecto / imuno / outros
("quinolona","quelante","m","Cálcio, ferro e antiácidos quelam a quinolona: absorção ↓.","Tomar a quinolona 2 h antes ou 6 h depois."),
("quinolona","corticoide","m","Risco aumentado de tendinopatia/ruptura de tendão.","Evitar em idosos; suspender ao primeiro sintoma."),
("metotrexato","smx","c","Antifólicos somados: pancitopenia grave.","Contraindicada; evitar mesmo em baixas doses."),
("metotrexato","aine","m","AINE reduz o clearance do metotrexato (grave em altas doses; em baixas doses, monitorar).","Monitorar hemograma e função renal."),
("metotrexato","ibp","m","IBP pode elevar o metotrexato (principalmente em altas doses).","Considerar suspender o IBP com altas doses."),
("azatioprina","alopurinol","g","Alopurinol inibe a xantina-oxidase: toxicidade medular grave.","Reduzir azatioprina para 25–33% da dose e monitorar hemograma."),
("colchicina","claritromicina","g","Inibição de CYP3A4/P-gp: toxicidade fatal da colchicina.","Evitar; se inevitável, reduzir muito a dose e monitorar (contraindicada se disfunção renal/hepática)."),
("colchicina","eritromicina","g","Eleva colchicina.","Evitar ou reduzir dose."),
("colchicina","azol","g","Inibição forte de CYP3A4/P-gp: toxicidade da colchicina.","Evitar; reduzir dose conforme bula."),
("colchicina","bccnd","m","Verapamil/diltiazem elevam a colchicina.","Reduzir a dose de colchicina; monitorar toxicidade."),
("sildenafila","nitrato","c","Hipotensão grave e potencialmente fatal.","Contraindicada em qualquer momento do uso de nitrato; aguardar ≥ 24 h (sildenafila)."),
("ondansetrona","tramadol","m","Ondansetrona pode reduzir a analgesia do tramadol e somar efeito serotoninérgico.","Monitorar."),
("prednisona","tiazidico","m","Hipopotassemia aditiva.","Monitorar K."),
("prednisona","alca","m","Hipopotassemia aditiva.","Monitorar K."),
]
def main():
    drugs = []
    for l in F.split("\n"):
        n, c, en = l.split("|")
        drugs.append({"n": n, "c": [x for x in c.split(",") if x], "en": en})
    nomes = {d["n"] for d in drugs}; classes = {c for d in drugs for c in d["c"]}
    regras = []
    for a, b, s, m, c in R:
        for x in (a, b):
            if x not in nomes and x not in classes:
                sys.exit("token desconhecido: %s" % x)
        regras.append({"a": a, "b": b, "s": s, "m": m, "c": c})
    json.dump({"farmacos": drugs, "regras": regras}, open("data/interacoes.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print(len(drugs), "fármacos;", len(regras), "regras")
main()
