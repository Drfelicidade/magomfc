#!/usr/bin/env python3
"""Gera data/manobras.json (manobras de exame físico). Uso: python3 scripts/manobras-fonte.py
Campos: sistema | região | nome | outros nomes | para que serve | como fazer | o que é positivo | observação"""
import json, re, unicodedata

M = "Musculoesquelético"
N = "Neurológico"
C = "Cardiovascular e vascular"
A = "Abdome"
T = "Tórax e respiratório"
H = "Cabeça e pescoço"

D = [
# ---------------- OMBRO ----------------
(M,"Ombro","Teste de Neer","Sinal do impacto","Síndrome do impacto subacromial (tendinopatia do manguito rotador, bursite).","Paciente sentado ou em pé. Com uma mão estabilize a escápula e com a outra eleve passivamente o braço em rotação interna, pelo plano da escápula, até a flexão anterior máxima.","Dor no arco final da elevação, referida no ombro anterolateral.","Pouco específico: também dói em outras causas de ombro doloroso. Combine com Hawkins-Kennedy e arco doloroso."),
(M,"Ombro","Teste de Hawkins-Kennedy","","Síndrome do impacto subacromial.","Com o ombro a 90° de flexão anterior e o cotovelo a 90°, faça rotação interna passiva do ombro (o antebraço desce), levando o tubérculo maior sob o ligamento coracoacromial.","Dor no ombro durante a rotação interna.",""),
(M,"Ombro","Teste de Jobe","Lata vazia (empty can)","Lesão ou tendinopatia do supraespinhal.","Ombro a 90° de abdução no plano da escápula (cerca de 30° à frente do plano coronal), rotação interna com os polegares apontando para baixo. Peça para manter a posição enquanto você faz pressão para baixo no antebraço.","Dor ou fraqueza, comparando com o lado contralateral.","A variante com polegares para cima («lata cheia») dói menos e avalia o mesmo tendão."),
(M,"Ombro","Teste de Patte","Rotadores externos","Lesão do infraespinhal e do redondo menor.","Ombro a 90° de abdução no plano da escápula e cotovelo a 90°. Peça rotação externa contra sua resistência (mão no punho/antebraço).","Dor ou fraqueza. Incapacidade de manter a posição de rotação externa = sinal do corneteiro (hornblower), sugere rotura extensa.",""),
(M,"Ombro","Lift-off de Gerber","Teste do subescapular","Lesão do músculo subescapular.","Coloque o dorso da mão do paciente na região lombar (rotação interna). Peça para afastar a mão das costas contra resistência. Se não conseguir posicionar a mão, use o belly-press.","Incapacidade de afastar a mão das costas ou dor.","Exige rotação interna preservada."),
(M,"Ombro","Belly-press","Sinal de Napoleão","Lesão do subescapular (alternativa ao lift-off).","Paciente com a palma da mão sobre o abdome e o cotovelo à frente do tronco. Peça para pressionar o abdome mantendo o punho reto e o cotovelo à frente.","Flexão do punho ou queda do cotovelo para trás do tronco (compensação com o dorsal).",""),
(M,"Ombro","Teste de Speed","","Tendinopatia da cabeça longa do bíceps.","Ombro a 90° de flexão, cotovelo estendido e antebraço supinado. Peça para elevar o braço contra sua resistência.","Dor no sulco bicipital.",""),
(M,"Ombro","Teste de Yergason","","Tendinopatia da cabeça longa do bíceps; instabilidade do tendão no sulco.","Cotovelo a 90° junto ao tronco, antebraço pronado. Peça supinação e rotação externa contra sua resistência, palpando o sulco bicipital.","Dor no sulco bicipital ou subluxação do tendão.",""),
(M,"Ombro","Teste de O'Brien","Compressão ativa","Lesão labral tipo SLAP; patologia da articulação acromioclavicular.","Ombro a 90° de flexão e 10–15° de adução, rotação interna (polegar para baixo). Faça pressão para baixo contra a resistência do paciente. Repita com o antebraço em supinação.","Dor profunda com polegar para baixo que melhora em supinação = SLAP. Dor localizada sobre a articulação acromioclavicular = patologia acromioclavicular.","Boa parte dos estudos mostra acurácia limitada isoladamente."),
(M,"Ombro","Teste de apreensão (anterior)","Crank","Instabilidade anterior do ombro (luxação recidivante).","Paciente em decúbito dorsal ou sentado, ombro a 90° de abdução e cotovelo a 90°. Faça rotação externa lenta e progressiva.","Sensação de que o ombro vai sair do lugar (apreensão). Dor sem apreensão é menos específica.","Relocation (Jobe): com o ombro na posição de apreensão, empurre o úmero posteriormente; a apreensão diminui."),
(M,"Ombro","Sinal do sulco","Sulcus","Instabilidade inferior ou multidirecional do ombro.","Paciente sentado com o braço relaxado ao lado do corpo. Faça tração para baixo no punho ou cotovelo.","Depressão (sulco) visível entre o acrômio e a cabeça do úmero.","Comparar com o outro lado; frouxidão generalizada dá resultado bilateral."),
(M,"Ombro","Adução horizontal forçada","Cross-body","Patologia da articulação acromioclavicular.","Braço a 90° de flexão. Leve passivamente o braço em adução horizontal, cruzando o corpo.","Dor localizada sobre a articulação acromioclavicular.",""),
(M,"Ombro","Teste da queda do braço","Drop arm","Rotura extensa do manguito rotador (supraespinhal).","Abduza passivamente o ombro até 90° e peça para descer lentamente o braço, sem apoio.","Incapacidade de controlar a descida (o braço cai) ou dor intensa.",""),

# ---------------- COTOVELO ----------------
(M,"Cotovelo","Teste de Cozen","","Epicondilite lateral (cotovelo de tenista).","Cotovelo a 90°, antebraço pronado. Palpe o epicôndilo lateral e peça extensão do punho com desvio radial contra sua resistência.","Dor no epicôndilo lateral.",""),
(M,"Cotovelo","Teste de Mill","","Epicondilite lateral.","Estenda passivamente o cotovelo com o antebraço pronado e o punho fletido.","Dor no epicôndilo lateral.",""),
(M,"Cotovelo","Epicondilite medial (cotovelo de golfista)","Teste de flexão resistida do punho","Epicondilite medial.","Antebraço supinado, cotovelo estendido. Peça flexão do punho contra resistência, palpando o epicôndilo medial.","Dor no epicôndilo medial.",""),
(M,"Cotovelo","Estresse em valgo do cotovelo","","Lesão do ligamento colateral ulnar (arremessadores).","Cotovelo a 20–30° de flexão, com o úmero estabilizado. Aplique força em valgo (empurrando o cotovelo medialmente e o antebraço lateralmente).","Dor medial ou frouxidão em relação ao lado contralateral.",""),
(M,"Cotovelo","Estresse em varo do cotovelo","","Lesão do ligamento colateral lateral.","Cotovelo a 20–30° de flexão. Aplique força em varo.","Dor lateral ou frouxidão.",""),
(M,"Cotovelo","Sinal de Tinel no cotovelo","","Neuropatia ulnar no sulco epitroclear-olécrano (síndrome do túnel cubital).","Percuta com o dedo ou martelo o nervo ulnar no sulco entre o epicôndilo medial e o olécrano.","Formigamento nos dedos anular e mínimo.","Complemente com o teste de flexão do cotovelo por 1–3 minutos."),

# ---------------- PUNHO E MÃO ----------------
(M,"Punho e mão","Teste de Phalen","","Síndrome do túnel do carpo (nervo mediano).","Peça para encostar os dorsos das mãos, com os punhos em flexão máxima, e manter por até 60 segundos.","Formigamento ou dormência nos dedos polegar, indicador, médio e metade radial do anular.",""),
(M,"Punho e mão","Sinal de Tinel no carpo","","Síndrome do túnel do carpo.","Percuta a face volar do punho sobre o túnel do carpo, no trajeto do nervo mediano.","Formigamento irradiado para os dedos inervados pelo mediano.",""),
(M,"Punho e mão","Teste de Durkan","Compressão do carpo","Síndrome do túnel do carpo.","Comprima com os polegares o túnel do carpo (região volar central do punho) por 30 segundos.","Formigamento ou dormência no território do mediano.",""),
(M,"Punho e mão","Teste de Finkelstein","","Tenossinovite de De Quervain (1º compartimento dorsal).","Peça para o paciente fechar o punho com o polegar dentro dos outros dedos. Faça desvio ulnar passivo do punho.","Dor aguda sobre o processo estiloide do rádio.",""),
(M,"Punho e mão","Palpação da tabaqueira anatômica","Suspeita de fratura do escafoide","Fratura do escafoide após queda com a mão espalmada.","Palpe a tabaqueira anatômica (entre os tendões extensores do polegar) e o tubérculo do escafoide. Aplique compressão axial no polegar.","Dor à palpação da tabaqueira ou à compressão axial: tratar como fratura de escafoide até prova em contrário, mesmo com radiografia inicial normal (repetir em 10–14 dias ou usar outra imagem).",""),
(M,"Punho e mão","Teste de Watson","Scaphoid shift","Instabilidade escafo-semilunar.","Polegar do examinador sobre o tubérculo do escafoide (face volar). Leve o punho do desvio ulnar para o radial com o polegar pressionando o escafoide.","Dor ou estalido/deslocamento do escafoide sobre a borda dorsal do rádio.",""),
(M,"Punho e mão","Sinal de Froment","","Paralisia do nervo ulnar (adutor do polegar).","Peça para segurar uma folha de papel entre o polegar e o indicador (pinça lateral) enquanto você puxa a folha.","Flexão da interfalângica do polegar para compensar (uso do flexor longo do polegar, inervado pelo mediano).",""),
(M,"Punho e mão","Teste de Allen","","Perfusão arterial da mão e integridade do arco palmar (antes de punção radial, por exemplo).","Comprima as artérias radial e ulnar no punho enquanto o paciente abre e fecha a mão até ficar pálida. Solte uma artéria e observe o retorno da cor da palma.","Retorno lento (mais de cerca de 5–7 segundos) indica insuficiência da artéria liberada.",""),

# ---------------- COLUNA CERVICAL ----------------
(M,"Coluna cervical","Teste de Spurling","Compressão foraminal","Radiculopatia cervical (compressão de raiz nervosa).","Paciente sentado. Incline o pescoço para o lado sintomático com leve extensão e aplique compressão axial suave sobre a cabeça.","Reprodução da dor irradiada para o membro superior no dermátomo da raiz.","Interrompa se surgir dor intensa ou sintomas neurológicos."),
(M,"Coluna cervical","Teste de distração cervical","","Radiculopatia cervical: confirma se a tração alivia os sintomas.","Com o paciente sentado ou deitado, segure o queixo e o occipício e faça tração suave para cima.","Alívio da dor irradiada ao membro superior.",""),
(M,"Coluna cervical","Sinal de Lhermitte","","Mielopatia cervical; lesão medular cervical; esclerose múltipla.","Flexione passivamente o pescoço, ou pergunte se a flexão do pescoço causa choque elétrico pela coluna.","Sensação de choque descendo pela coluna e membros.",""),
(M,"Coluna cervical","Sinal de Bakody","Alívio pela abdução do ombro","Radiculopatia cervical (C4–C6).","Peça para colocar a mão do lado dolorido sobre a cabeça.","Alívio da dor irradiada ao braço.",""),

# ---------------- COLUNA LOMBAR E SACROILÍACA ----------------
(M,"Coluna lombar e sacroilíaca","Manobra de Lasègue","Elevação da perna estendida (SLR)","Radiculopatia lombossacra (hérnia de disco L5-S1).","Paciente em decúbito dorsal. Eleve passivamente a perna estendida, com o quadril em flexão e o joelho em extensão.","Dor irradiada para a perna, abaixo do joelho, entre cerca de 30° e 70° de elevação. Dor apenas nas costas ou na região posterior da coxa não vale.",""),
(M,"Coluna lombar e sacroilíaca","Lasègue cruzado","Crossed SLR","Hérnia discal com compressão radicular (alta especificidade).","Eleve a perna assintomática, como no Lasègue.","Reprodução da dor irradiada no lado sintomático.",""),
(M,"Coluna lombar e sacroilíaca","Sinal de Bragard","","Confirma a origem neural da dor no Lasègue.","Com o Lasègue positivo, reduza levemente a elevação até a dor aliviar e faça dorsiflexão passiva do pé.","Reaparecimento ou piora da dor.",""),
(M,"Coluna lombar e sacroilíaca","Teste de estiramento femoral","Lasègue invertido","Radiculopatia de L2–L4 (nervo femoral).","Paciente em decúbito ventral. Flexione o joelho até o máximo e depois estenda o quadril, elevando a coxa.","Dor na face anterior da coxa.",""),
(M,"Coluna lombar e sacroilíaca","Teste de Slump","","Tensão neural (radiculopatia, neuropatia).","Paciente sentado, mãos atrás das costas. Peça flexão da coluna (encurvar), flexão cervical, extensão ativa do joelho e dorsiflexão do pé, em sequência.","Reprodução dos sintomas, que aliviam com a extensão do pescoço.",""),
(M,"Coluna lombar e sacroilíaca","Manobra de Valsalva","","Aumento da pressão intratecal por compressão radicular (hérnia, tumor).","Peça para o paciente prender a respiração e fazer força (ou tossir).","Reprodução ou piora da dor irradiada.",""),
(M,"Coluna lombar e sacroilíaca","Teste de Gaenslen","","Disfunção da articulação sacroilíaca.","Paciente em decúbito dorsal na borda da maca. Flexione ao máximo um quadril (joelho ao peito) e deixe a outra perna pendente, aplicando pressão para baixo (extensão do quadril).","Dor na região sacroilíaca.",""),
(M,"Coluna lombar e sacroilíaca","Testes de provocação da sacroilíaca","Cluster de Laslett","Dor de origem sacroilíaca.","Cinco manobras: distração (pressão posterior nas EIAS em decúbito dorsal), thigh thrust (quadril a 90°, empurre o fêmur para trás), compressão (decúbito lateral, pressão sobre a crista ilíaca), sacral thrust (prono, pressão sobre o sacro) e Gaenslen.","Dor reproduzida em pelo menos 3 dos testes sugere origem sacroilíaca.",""),
(M,"Coluna lombar e sacroilíaca","Teste de Schober modificado","","Redução da mobilidade lombar (espondilite anquilosante, espondiloartrites).","Marque a linha entre as espinhas ilíacas póstero-superiores, um ponto 10 cm acima e outro 5 cm abaixo. Peça flexão máxima do tronco com joelhos estendidos e meça a distância entre os pontos.","Aumento menor que 5 cm (de 15 para menos de 20 cm) indica mobilidade reduzida.",""),
(M,"Coluna lombar e sacroilíaca","Teste de Adams","Flexão anterior do tronco","Escoliose estrutural (gibosidade costal).","Paciente em pé, pés juntos. Peça para fletir o tronco para frente com joelhos estendidos e braços pendentes. Observe o dorso por trás, pela linha do olhar tangencial.","Assimetria (giba) costal ou lombar.",""),

# ---------------- QUADRIL ----------------
(M,"Quadril","Teste de Patrick","FABER (Flexão, ABdução, Rotação externa)","Patologia do quadril (dor inguinal) e da articulação sacroilíaca.","Paciente em decúbito dorsal. Coloque o tornozelo sobre o joelho oposto (posição de 4). Pressione suavemente o joelho da perna flexionada para baixo e estabilize a pelve contralateral.","Dor na virilha sugere quadril; dor posterior sugere sacroilíaca; limitação de abdução sugere problema do quadril.",""),
(M,"Quadril","Teste de FADIR","Impacto femoroacetabular","Impacto femoroacetabular; lesão labral.","Paciente em decúbito dorsal. Flexione o quadril a 90°, aduza e faça rotação interna passiva.","Dor inguinal reproduzindo a queixa.",""),
(M,"Quadril","Log roll","Rolamento passivo","Doença intra-articular do quadril.","Com o paciente deitado e as pernas estendidas, gire passivamente o membro inteiro para dentro e para fora rolando a coxa.","Dor ou limitação da rotação (dor na virilha).","Útil para diferenciar dor intra-articular de dor periarticular."),
(M,"Quadril","Teste de Stinchfield","Elevação resistida da perna","Doença intra-articular do quadril.","Paciente deitado, quadril a 30° de flexão com joelho estendido. Peça para elevar a perna contra sua resistência.","Dor inguinal.",""),
(M,"Quadril","Sinal de Trendelenburg","","Fraqueza dos abdutores do quadril (glúteo médio) ou dor no quadril.","Paciente em pé, de costas para o examinador. Peça para elevar uma perna (apoio unipodal) por cerca de 30 segundos.","A pelve cai do lado da perna elevada (oposto ao apoio): fraqueza do glúteo médio do lado do apoio.",""),
(M,"Quadril","Teste de Thomas","","Contratura em flexão do quadril (iliopsoas).","Paciente em decúbito dorsal na borda da maca. Flexione um quadril até o joelho tocar o peito, para achatar a lordose lombar. Observe a outra perna.","A coxa contralateral se eleva da maca: contratura em flexão do quadril; extensão do joelho: encurtamento do reto femoral.",""),
(M,"Quadril","Teste de Ober","","Tensão do trato iliotibial e do tensor da fáscia lata.","Paciente em decúbito lateral com o lado a testar para cima. Abduza e estenda o quadril com o joelho fletido a 90° e solte a perna.","A perna não cai até a linha de adução: encurtamento do trato iliotibial.",""),
(M,"Quadril","Teste de Ely","","Encurtamento do reto femoral.","Paciente em decúbito ventral. Flexione passivamente o joelho até o máximo.","O quadril se eleva da maca (flexiona) durante a flexão do joelho.",""),
(M,"Quadril","Manobras de Ortolani e Barlow","","Displasia do desenvolvimento do quadril em recém-nascidos e lactentes.","Bebê em decúbito dorsal, quadris e joelhos a 90° em flexão. Ortolani: com o dedo médio sobre o trocanter maior, abduza os quadris e eleve o trocanter (redução de quadril luxado). Barlow: aduza e empurre o fêmur posteriormente (luxação de quadril instável).","Ressalto palpável (clunk) na redução (Ortolani) ou luxação (Barlow). Considerar ultrassom do quadril.","Estalidos sem ressalto são frequentes e benignos."),
(M,"Quadril","Sinal de Galeazzi","","Displasia do quadril: diferença de comprimento do fêmur.","Bebê deitado, quadris e joelhos fletidos, pés juntos sobre a maca. Compare a altura dos joelhos.","Um joelho mais baixo que o outro.",""),
(M,"Quadril","Medida do comprimento dos membros","Comprimento real e aparente","Discrepância de membros inferiores.","Real: da espinha ilíaca anterossuperior ao maléolo medial. Aparente: do umbigo (ou apêndice xifoide) ao maléolo medial.","Diferença maior que cerca de 1 cm; real diferente = encurtamento ósseo; aparente diferente e real igual = obliquidade pélvica.",""),

# ---------------- JOELHO ----------------
(M,"Joelho","Teste de Lachman","","Lesão do ligamento cruzado anterior (LCA).","Paciente deitado, joelho a 20–30° de flexão. Estabilize o fêmur distal com uma mão e puxe a tíbia proximal anteriormente com a outra.","Translação anterior aumentada com ponto final mole, em comparação com o lado contralateral.","É mais sensível que a gaveta anterior."),
(M,"Joelho","Gaveta anterior","","Lesão do LCA.","Joelho a 90°, pé apoiado na maca (sentar sobre o pé). Segure a tíbia proximal com os polegares nos tendões dos isquiotibiais e puxe anteriormente.","Translação anterior maior que a do lado contralateral.",""),
(M,"Joelho","Gaveta posterior","","Lesão do ligamento cruzado posterior (LCP).","Joelho a 90°, pé apoiado. Empurre a tíbia proximal posteriormente. Observe também a queda posterior da tíbia com joelho a 90° (sinal do afundamento, sag sign).","Translação posterior aumentada ou tíbia caída posteriormente.",""),
(M,"Joelho","Pivot shift","","Instabilidade rotatória por lesão do LCA.","Paciente deitado, joelho estendido. Faça rotação interna da perna e valgo, e flexione progressivamente o joelho.","Redução súbita da tíbia subluxada por volta de 20–40° de flexão (ressalto).","Difícil de realizar com o paciente com dor ou contraído."),
(M,"Joelho","Estresse em valgo do joelho","","Lesão do ligamento colateral medial (LCM).","Joelho a 0° e a 30° de flexão. Uma mão no joelho (lateral) e a outra no tornozelo; aplique força em valgo.","Dor medial e/ou abertura articular. Frouxidão a 0° sugere lesão associada além do LCM.",""),
(M,"Joelho","Estresse em varo do joelho","","Lesão do ligamento colateral lateral (LCL) e cápsula posterolateral.","Joelho a 0° e a 30° de flexão. Aplique força em varo.","Dor lateral e/ou abertura articular.",""),
(M,"Joelho","Teste de McMurray","","Lesão de menisco.","Paciente deitado, quadril e joelho fletidos. Palpe a interlinha articular com uma mão. Rode a tíbia externamente com varo e estenda o joelho (menisco medial) ou rode internamente com valgo e estenda (menisco lateral).","Dor na interlinha ou estalido palpável.",""),
(M,"Joelho","Teste de Apley","Compressão e distração","Distingue lesão meniscal de lesão ligamentar.","Paciente em decúbito ventral, joelho a 90°. Compressão axial com rotação da tíbia reproduz dor meniscal. Repita com distração e rotação: dor sugere lesão ligamentar.","Dor na compressão = menisco; dor na distração = ligamento.",""),
(M,"Joelho","Teste de Thessaly","","Lesão de menisco.","Paciente em pé sobre uma perna, joelho a 20° de flexão. Segure as mãos do paciente e peça para girar o tronco para dentro e para fora.","Dor na interlinha, travamento ou bloqueio.",""),
(M,"Joelho","Sinal do abaulamento e balotamento patelar","Sinal da tecla","Derrame articular no joelho.","Derrame pequeno: ordenhe o líquido medialmente e bata na face lateral, observando abaulamento medial. Derrame grande: comprima a bolsa suprapatelar e pressione a patela para baixo (sensação de tecla).","Abaulamento ou rebote da patela contra o fêmur.",""),
(M,"Joelho","Teste de apreensão patelar","Fairbank","Instabilidade ou luxação patelar.","Joelho a 20–30° de flexão. Empurre a patela lateralmente com o polegar.","Apreensão do paciente e contração do quadríceps para impedir o deslocamento.",""),
(M,"Joelho","Teste de compressão patelofemoral","Sinal de Clarke","Síndrome patelofemoral; condropatia.","Paciente deitado, joelho estendido. Pressione a patela distalmente e peça contração do quadríceps.","Dor retropatelar.","Baixa especificidade: pode ser positivo em joelhos assintomáticos."),
(M,"Joelho","Teste de Noble","","Síndrome do trato iliotibial (dor lateral do joelho em corredores).","Palpe o epicôndilo lateral com o polegar e estenda passivamente o joelho a partir de 90° de flexão.","Dor forte por volta de 30° de flexão.",""),

# ---------------- TORNOZELO E PÉ ----------------
(M,"Tornozelo e pé","Regras de Ottawa do tornozelo","","Decidir a necessidade de radiografia no trauma de tornozelo e mediopé.","Palpe a borda posterior e a ponta dos maléolos, a base do 5º metatarso e o navicular; avalie se o paciente consegue dar 4 passos.","Dor óssea nesses pontos ou incapacidade de dar 4 passos indica radiografia. Ver ferramenta específica no menu.","Ferramenta completa: Regras de Ottawa (tornozelo)."),
(M,"Tornozelo e pé","Gaveta anterior do tornozelo","","Lesão do ligamento talofibular anterior.","Tornozelo a 10–20° de flexão plantar. Estabilize a tíbia com uma mão e puxe o calcanhar anteriormente com a outra.","Translação anterior aumentada, sulco na pele anterior à fíbula distal, ou ausência de ponto final firme.",""),
(M,"Tornozelo e pé","Inversão forçada (talar tilt)","","Lesão do ligamento calcaneofibular.","Tornozelo em posição neutra. Estabilize a tíbia e faça inversão forçada do calcanhar.","Inclinação talar aumentada ou dor lateral.",""),
(M,"Tornozelo e pé","Teste da compressão tibiofibular","Squeeze test","Lesão da sindesmose (entorse alta do tornozelo).","Comprima a tíbia e a fíbula juntas no terço médio da perna.","Dor no tornozelo, na região da sindesmose distal.",""),
(M,"Tornozelo e pé","Teste de rotação externa (Kleiger)","","Lesão da sindesmose e do ligamento deltoide.","Paciente sentado, joelho a 90°. Estabilize a perna e faça rotação externa do pé com o tornozelo em dorsiflexão.","Dor anterolateral sobre a sindesmose ou dor medial (deltoide).",""),
(M,"Tornozelo e pé","Teste de Thompson","Compressão da panturrilha","Rotura do tendão de Aquiles.","Paciente em decúbito ventral com os pés fora da maca (ou ajoelhado sobre a cadeira). Comprima a panturrilha.","Ausência de flexão plantar do pé (comparar com o lado contralateral). Palpe também falha no tendão.",""),
(M,"Tornozelo e pé","Teste de Windlass","Dorsiflexão do hálux","Fascite plantar.","Segure o hálux e faça dorsiflexão passiva da metatarsofalangeana, com o paciente sentado ou em pé.","Dor na inserção da fáscia plantar no calcanhar.",""),
(M,"Tornozelo e pé","Sinal de Mulder","Compressão do antepé","Neuroma de Morton.","Comprima o antepé lateralmente com uma mão e palpe o espaço entre os 3º e 4º metatarsos.","Dor, formigamento ou estalido palpável.",""),
(M,"Tornozelo e pé","Teste de Silfverskiöld","","Encurtamento do gastrocnêmio versus sóleo.","Avalie a dorsiflexão passiva do tornozelo com o joelho estendido e depois com o joelho fletido.","Dorsiflexão que melhora com o joelho fletido indica encurtamento do gastrocnêmio; limitação nas duas posições indica sóleo/cápsula.",""),
(M,"Tornozelo e pé","Elevação unipodal do calcanhar","Single heel rise","Insuficiência do tendão tibial posterior (pé plano adquirido).","Paciente em pé sobre uma perna. Peça para ficar na ponta do pé, e observe por trás.","Incapacidade de subir ou de inverter o calcanhar; sinal de «muitos dedos» (too many toes) visto por trás.",""),
(M,"Tornozelo e pé","Sinal de Tinel do tarso","","Síndrome do túnel do tarso (nervo tibial).","Percuta o nervo tibial posterior atrás do maléolo medial.","Formigamento na planta do pé.",""),

# ---------------- NEUROLÓGICO ----------------
(N,"Equilíbrio e coordenação","Teste de Romberg","","Perda de propriocepção (coluna posterior) ou disfunção vestibular.","Paciente em pé, pés juntos, braços ao lado do corpo. Observe por 30 segundos com olhos abertos e depois fechados. Fique atento para segurar em caso de queda.","Oscilação ou queda ao fechar os olhos.",""),
(N,"Equilíbrio e coordenação","Prova dedo-nariz e calcanhar-joelho","","Dismetria e ataxia cerebelar.","Dedo-nariz: peça para tocar alternadamente o próprio nariz e o dedo do examinador, que muda de posição. Calcanhar-joelho: com o paciente deitado, peça para deslizar o calcanhar da tíbia do joelho ao tornozelo oposto.","Erro de alvo (dismetria), tremor intencional ou trajetória irregular.",""),
(N,"Equilíbrio e coordenação","Diadococinesia","","Disfunção cerebelar (disdiadococinesia).","Peça para bater rapidamente uma mão na outra, alternando palma e dorso, ou fazer pronação e supinação rápidas do antebraço.","Movimentos lentos, irregulares ou desorganizados.",""),
(N,"Equilíbrio e coordenação","Marcha em tandem","","Ataxia cerebelar ou vestibular.","Peça para andar em linha reta colocando o calcanhar de um pé na frente da ponta do outro.","Desvio, alargamento da base ou perda de equilíbrio.",""),
(N,"Força e reflexos","Prova de Barré","Desvio pronador","Paresia leve do membro superior (via piramidal).","Braços estendidos à frente, com as palmas para cima e olhos fechados por 20–30 segundos.","Pronação e queda de um dos braços. Para os membros inferiores (Mingazzini): deitado, pernas fletidas a 90° sem apoio, e queda de uma delas.",""),
(N,"Força e reflexos","Graduação da força muscular","Escala MRC","Quantificar a força muscular (déficit motor).","Teste grupos musculares contra resistência, comparando os lados.","0: sem contração; 1: contração visível sem movimento; 2: movimento sem vencer a gravidade; 3: vence a gravidade; 4: vence resistência parcial; 5: força normal.",""),
(N,"Força e reflexos","Reflexos osteotendíneos","","Síndrome do neurônio motor superior (hiper-reflexia) ou inferior/neuropatia (hipo-reflexia).","Percuta com o martelo os tendões bicipital, tricipital, braquiorradial, patelar e aquileu, com o paciente relaxado. Use manobra de reforço de Jendrassik (puxar as mãos entrelaçadas) se o reflexo estiver ausente.","Graduação de 0 a 4+ e comparação entre os lados. Clônus sustentado sugere lesão piramidal.",""),
(N,"Força e reflexos","Sinal de Babinski","Reflexo cutâneo-plantar","Lesão do trato corticoespinhal (neurônio motor superior).","Estimule com um objeto rombo a borda lateral da planta do pé, do calcanhar até a base dos dedos, curvando pelo antepé.","Extensão (dorsiflexão) do hálux com abertura em leque dos demais dedos. Normal em bebês pequenos.",""),
(N,"Força e reflexos","Sinal de Hoffmann","","Mielopatia cervical ou lesão do neurônio motor superior nos membros superiores.","Segure a falange média do dedo médio do paciente e faça um movimento rápido de flexão da unha (piparote).","Flexão e adução reflexas do polegar e do indicador.","Pode ocorrer em pessoas normais com reflexos vivos, se simétrico."),
(N,"Meninges","Rigidez de nuca","","Irritação meníngea (meningite, hemorragia subaracnóidea).","Paciente deitado. Flexione passivamente o pescoço, levando o queixo ao peito.","Resistência ou dor à flexão, sem limitação à rotação.",""),
(N,"Meninges","Sinal de Kernig","","Irritação meníngea.","Paciente deitado, com quadril e joelho fletidos a 90°. Estenda passivamente o joelho.","Dor ou resistência à extensão do joelho.",""),
(N,"Meninges","Sinal de Brudzinski","","Irritação meníngea.","Paciente deitado. Flexione passivamente o pescoço.","Flexão involuntária dos quadris e joelhos.",""),
(N,"Outros","Sinais de Chvostek e Trousseau","","Hipocalcemia (tetania latente).","Chvostek: percuta o nervo facial 2 cm à frente do lóbulo da orelha. Trousseau: insufle o manguito acima da pressão sistólica por 3 minutos.","Chvostek: contração da musculatura facial ipsilateral. Trousseau: espasmo carpal (mão de parteiro).","Chvostek pode estar presente em pessoas saudáveis."),
(N,"Outros","Cincinnati (FAST) para AVC","","Reconhecimento rápido de acidente vascular cerebral.","Peça para sorrir (face), elevar os dois braços por 10 segundos (braço) e repetir uma frase simples (fala).","Assimetria facial, queda de um braço ou fala alterada: suspeita de AVC; acionar o serviço de urgência. Ver ferramenta NIHSS.","Ferramenta completa: escala NIHSS."),

# ---------------- CARDIOVASCULAR E VASCULAR ----------------
(C,"Pressão arterial","Hipotensão ortostática","","Queda pressórica ao levantar (medicações, disautonomia, hipovolemia); síncope; quedas em idosos.","Paciente deitado por 5 minutos; meça a pressão e a frequência cardíaca. Peça para levantar-se e meça em 1 e 3 minutos em pé.","Queda de 20 mmHg ou mais na sistólica, ou de 10 mmHg ou mais na diastólica, com ou sem sintomas.","Aumento pequeno da frequência cardíaca (menos de 15 bpm) sugere causa neurogênica (disautonomia)."),
(C,"Ausculta","Manobras dinâmicas na ausculta cardíaca","Valsalva, agachamento, handgrip","Diferenciar sopros (cardiomiopatia hipertrófica, estenose aórtica, insuficiência mitral, prolapso mitral).","Valsalva (fase de esforço) e ficar em pé diminuem o retorno venoso; agachar aumenta o retorno venoso e a pós-carga; handgrip (preensão manual sustentada) aumenta a pós-carga.","Sopro da cardiomiopatia hipertrófica aumenta com Valsalva e em pé e diminui ao agachar e no handgrip. Sopros de estenose aórtica diminuem com Valsalva. Sopro de insuficiência mitral e de comunicação interventricular aumentam com handgrip.",""),
(C,"Ausculta","Sinal de Rivero-Carvallo","","Sopros do coração direito (insuficiência tricúspide).","Ausculte o sopro na área tricúspide durante a inspiração profunda.","Aumento da intensidade do sopro na inspiração.",""),
(C,"Vascular periférico","Teste de Buerger","Elevação e dependência","Doença arterial periférica grave (isquemia crônica de membros inferiores).","Paciente deitado, eleve as pernas a 45° por 1–2 minutos e observe a palidez plantar. Sente-se e deixe as pernas pendentes: observe o retorno da cor.","Palidez na elevação e rubor (hiperemia reativa) exagerado e lento na dependência.",""),
(C,"Vascular periférico","Índice tornozelo-braquial","ITB","Doença arterial periférica.","Paciente deitado por 10 minutos. Meça a pressão sistólica braquial nos dois braços e as pressões das artérias pediosa e tibial posterior com Doppler. ITB = maior pressão do tornozelo dividida pela maior pressão braquial.","ITB ≤ 0,90 diagnostica doença arterial periférica; > 1,40 sugere artérias não compressíveis (calcificadas).",""),
(C,"Vascular periférico","Sinal de Godet","Cacifo","Edema (insuficiência cardíaca, renal, hepática, venosa).","Comprima com o polegar a face anterior da tíbia, região maleolar ou sacro por cerca de 5 segundos.","Depressão que persiste após soltar (cacifo). Grau de +1 a +4 conforme a profundidade e o tempo de recuperação.","Ausência de cacifo em edema volumoso sugere linfedema ou mixedema."),
(C,"Vascular periférico","Sinal de Stemmer","","Linfedema.","Tente pinçar a pele do dorso da base do segundo dedo do pé (ou da mão).","Impossibilidade de pinçar a pele.",""),

# ---------------- ABDOME ----------------
(A,"Dor abdominal","Sinal de Murphy","","Colecistite aguda.","Palpe o ponto cístico (sob o rebordo costal direito) enquanto o paciente inspira profundamente.","Interrupção súbita da inspiração por dor (apneia inspiratória).",""),
(A,"Dor abdominal","Sinal de Blumberg","Descompressão brusca dolorosa","Irritação peritoneal (peritonite).","Comprima lentamente o abdome com a mão e solte de forma súbita.","Dor mais intensa na descompressão que na compressão.",""),
(A,"Dor abdominal","Ponto de McBurney","","Apendicite aguda.","Palpe a junção do terço lateral com os dois terços mediais da linha entre a espinha ilíaca anterossuperior direita e o umbigo.","Dor localizada à palpação, com defesa ou descompressão dolorosa.",""),
(A,"Dor abdominal","Sinal de Rovsing","","Apendicite aguda.","Palpe a fossa ilíaca esquerda de forma profunda, empurrando o cólon em direção ao ceco.","Dor na fossa ilíaca direita.",""),
(A,"Dor abdominal","Sinal do psoas","","Apendicite retrocecal ou abscesso do psoas.","Paciente em decúbito lateral esquerdo: estenda passivamente o quadril direito. Ou peça flexão do quadril direito contra resistência.","Dor abdominal à direita.",""),
(A,"Dor abdominal","Sinal do obturador","","Apendicite pélvica; abscesso pélvico.","Paciente deitado com o quadril e joelho fletidos a 90°: faça rotação interna passiva do quadril.","Dor hipogástrica ou na fossa ilíaca direita.",""),
(A,"Dor abdominal","Sinal de Carnett","","Distinguir dor da parede abdominal de dor visceral.","Localize o ponto doloroso. Peça para elevar a cabeça e os ombros (contrair a musculatura abdominal) e palpe novamente.","Dor que persiste ou piora: origem na parede abdominal. Dor que diminui: origem visceral.",""),
(A,"Dor abdominal","Sinal de Giordano","Punho-percussão lombar","Pielonefrite; cólica renal.","Percuta a região costovertebral com a borda ulnar da mão fechada, sobre a mão espalmada do examinador.","Dor intensa no ângulo costovertebral.",""),
(A,"Abdome","Matidez móvel e piparote","","Ascite.","Matidez móvel: percuta os flancos com o paciente em decúbito dorsal e depois em decúbito lateral; a macicez muda de lugar. Piparote: peça a um ajudante para apoiar a borda ulnar da mão na linha média do abdome e dê um piparote em um flanco, sentindo a onda no outro.","Macicez que se desloca ou onda líquida transmitida.",""),
(A,"Abdome","Exame de hérnia inguinal","Manobra de Valsalva","Hérnia inguinal ou femoral.","Paciente em pé. Inspecione e palpe o canal inguinal, invaginando o escroto com o dedo, enquanto o paciente tosse ou faz Valsalva.","Impulso ou abaulamento sob o dedo durante a tosse.",""),

# ---------------- TÓRAX E RESPIRATÓRIO ----------------
(T,"Tórax","Frêmito toracovocal","","Consolidação pulmonar, derrame pleural, pneumotórax.","Apoie as mãos espalmadas nos dois hemitórax simétricos e peça para repetir «trinta e três», comparando as vibrações.","Aumentado na consolidação; diminuído ou abolido em derrame pleural, pneumotórax e obstrução brônquica.",""),
(T,"Tórax","Percussão torácica","","Consolidação, derrame pleural, pneumotórax, hiperinsuflação.","Apoie o dedo médio de uma mão sobre o tórax e percuta a falange média com o dedo médio da outra, comparando pontos simétricos.","Maciço em consolidação e derrame; timpânico em pneumotórax; hipersonoro em enfisema.",""),
(T,"Tórax","Ausculta vocal (egofonia, broncofonia)","","Consolidação pulmonar.","Ausculte o tórax enquanto o paciente diz «trinta e três» ou «i»; na egofonia o «i» soa como «a».","Voz mais nítida (broncofonia) ou egofonia sobre áreas de consolidação.",""),
(T,"Tórax","Tempo expiratório forçado","","Obstrução ao fluxo aéreo (DPOC, asma).","Ausculte a traqueia enquanto o paciente expira forçadamente após inspiração máxima.","Expiração audível por mais de 6 segundos sugere obstrução.","Complementar, não substitui a espirometria."),
(T,"Tórax","Sinal de Hoover","","Hiperinsuflação (DPOC grave).","Observe o gradil costal inferior durante a inspiração.","Retração paradoxal das últimas costelas na inspiração.",""),

# ---------------- CABEÇA E PESCOÇO ----------------
(H,"Vestibular","Manobra de Dix-Hallpike","","Vertigem posicional paroxística benigna (VPPB) do canal posterior.","Paciente sentado, com a cabeça virada 45° para um lado. Deite-o rapidamente com a cabeça pendente 20° além da maca, mantendo a rotação, por cerca de 30–60 segundos, observando os olhos.","Vertigem com nistagmo torcional-vertical de início tardio, que dura menos de 1 minuto e cansa ao repetir.","Para o canal horizontal, use o teste de rotação da cabeça (supine roll test). Se positivo, tratar com manobra de Epley."),
(H,"Vestibular","Teste do impulso cefálico","Head impulse","Hipofunção vestibular periférica (neurite vestibular) versus causa central.","Paciente sentado, olhando o nariz do examinador. Faça uma rotação rápida e curta da cabeça (cerca de 15°) para cada lado.","Sacada corretiva (refixação) do olhar após a rotação: hipofunção vestibular periférica do lado da rotação. Teste normal em síndrome vestibular aguda com nistagmo espontâneo sugere causa central.","Faz parte do HINTS: exige treinamento."),
(H,"Ouvido","Testes de Rinne e Weber","Diapasão","Diferenciar perda auditiva condutiva de neurossensorial.","Rinne: coloque o diapasão de 512 Hz na mastoide e depois diante do meato. Weber: coloque o diapasão no meio da testa ou do vértice do crânio e pergunte de que lado o som é mais forte.","Rinne: condução óssea maior que a aérea sugere perda condutiva. Weber: lateraliza para o lado com perda condutiva ou para o lado normal em perda neurossensorial.",""),
(H,"Pescoço","Palpação da tireoide","","Bócio, nódulos tireoidianos, tireoidite.","Posicione-se atrás do paciente, com os dedos sobre a região da tireoide, abaixo da cartilagem cricoide. Peça para engolir (com água) e sinta o movimento da glândula.","Aumento difuso, nódulos, consistência endurecida, fixação a planos profundos ou linfonodos cervicais.",""),
]

# ---------------- ROTEIROS POR QUEIXA ----------------
# (título, dica, [nomes das manobras na ordem sugerida])
ROTEIROS = [
("Dor no ombro","Comece pela inspeção, palpação e amplitude de movimento; depois teste impacto, manguito e bíceps. Lembre de descartar origem cervical.",["Teste de Neer","Teste de Hawkins-Kennedy","Teste de Jobe","Teste de Patte","Lift-off de Gerber","Belly-press","Teste da queda do braço","Teste de Speed","Teste de Yergason","Teste de O'Brien","Adução horizontal forçada","Teste de Spurling"]),
("Instabilidade ou luxação do ombro","Compare com o lado contralateral e pesquise frouxidão generalizada.",["Teste de apreensão (anterior)","Sinal do sulco","Teste de O'Brien"]),
("Dor no cotovelo","Palpe os epicôndilos e o sulco ulnar.",["Teste de Cozen","Teste de Mill","Epicondilite medial (cotovelo de golfista)","Estresse em valgo do cotovelo","Estresse em varo do cotovelo","Sinal de Tinel no cotovelo"]),
("Formigamento ou dormência na mão","Distinga compressão no carpo, no cotovelo ou na raiz cervical.",["Teste de Phalen","Sinal de Tinel no carpo","Teste de Durkan","Sinal de Tinel no cotovelo","Sinal de Froment","Teste de Spurling","Reflexos osteotendíneos","Graduação da força muscular"]),
("Dor no punho ou na mão após queda","Dor na tabaqueira anatômica exige imobilização e reavaliação, mesmo com radiografia inicial normal.",["Palpação da tabaqueira anatômica","Teste de Watson","Teste de Finkelstein","Teste de Allen"]),
("Dor cervical com irradiação para o braço","Pesquise sinais de compressão radicular e de mielopatia.",["Teste de Spurling","Teste de distração cervical","Sinal de Bakody","Sinal de Lhermitte","Sinal de Hoffmann","Reflexos osteotendíneos","Graduação da força muscular","Sinal de Babinski"]),
("Lombociatalgia","Avalie raiz nervosa, tensão neural e sinais de alarme (déficit motor progressivo, retenção urinária).",["Manobra de Lasègue","Lasègue cruzado","Sinal de Bragard","Teste de estiramento femoral","Teste de Slump","Manobra de Valsalva","Reflexos osteotendíneos","Graduação da força muscular","Sinal de Babinski"]),
("Lombalgia com suspeita de espondiloartrite ou sacroilíaca","Dor inflamatória (piora no repouso, melhora com movimento) e rigidez matinal.",["Teste de Schober modificado","Testes de provocação da sacroilíaca","Teste de Gaenslen","Teste de Patrick"]),
("Dor no quadril ou na virilha","Diferencie dor intra-articular, periarticular e referida da coluna.",["Log roll","Teste de Stinchfield","Teste de Patrick","Teste de FADIR","Sinal de Trendelenburg","Teste de Thomas","Teste de Ober","Teste de Ely"]),
("Recém-nascido ou lactente: rastreio do quadril","Realize com o bebê calmo e relaxado; alteração exige ultrassom.",["Manobras de Ortolani e Barlow","Sinal de Galeazzi","Medida do comprimento dos membros"]),
("Trauma ou entorse do joelho","Avalie derrame, ligamentos e meniscos; regras de Ottawa do joelho para decidir radiografia.",["Sinal do abaulamento e balotamento patelar","Teste de Lachman","Gaveta anterior","Gaveta posterior","Pivot shift","Estresse em valgo do joelho","Estresse em varo do joelho","Teste de McMurray","Teste de Apley","Teste de Thessaly"]),
("Dor anterior do joelho","Pesquise patelofemoral, instabilidade patelar e trato iliotibial.",["Teste de compressão patelofemoral","Teste de apreensão patelar","Teste de Noble","Teste de Ober","Teste de Ely"]),
("Entorse de tornozelo","Comece pelas regras de Ottawa; depois avalie os ligamentos e a sindesmose.",["Regras de Ottawa do tornozelo","Gaveta anterior do tornozelo","Inversão forçada (talar tilt)","Teste da compressão tibiofibular","Teste de rotação externa (Kleiger)","Teste de Thompson"]),
("Dor no calcanhar ou no pé","Diferencie fascite plantar, tendinopatia do Aquiles, neuroma e compressão nervosa.",["Teste de Windlass","Teste de Thompson","Teste de Silfverskiöld","Elevação unipodal do calcanhar","Sinal de Mulder","Sinal de Tinel do tarso"]),
("Vertigem","Diferencie causa periférica (VPPB, neurite) de causa central; sinais de alarme exigem avaliação urgente.",["Manobra de Dix-Hallpike","Teste do impulso cefálico","Teste de Romberg","Marcha em tandem","Prova dedo-nariz e calcanhar-joelho","Testes de Rinne e Weber"]),
("Febre com cefaleia (suspeita de meningite)","Sinais meníngeos ausentes não excluem meningite; na dúvida, urgência.",["Rigidez de nuca","Sinal de Kernig","Sinal de Brudzinski"]),
("Dor abdominal na fossa ilíaca direita","Combine os sinais com o quadro clínico e, se indicado, imagem e avaliação cirúrgica.",["Ponto de McBurney","Sinal de Blumberg","Sinal de Rovsing","Sinal do psoas","Sinal do obturador","Sinal de Carnett"]),
("Dor no hipocôndrio direito","Correlacione com febre, icterícia e ultrassom.",["Sinal de Murphy","Sinal de Carnett"]),
("Dor lombar ou no flanco com febre ou disúria","Pesquise pielonefrite e cólica renal.",["Sinal de Giordano"]),
("Edema de membros inferiores","Diferencie edema sistêmico, venoso, linfático e arterial.",["Sinal de Godet","Sinal de Stemmer","Teste de Buerger","Índice tornozelo-braquial"]),
("Tontura ao levantar, síncope ou quedas em idosos","Revise medicações e avalie equilíbrio e marcha.",["Hipotensão ortostática","Teste de Romberg","Marcha em tandem","Sinal de Trendelenburg","Prova de Barré"]),
("Tosse ou dispneia","Combine com ausculta e saturação.",["Frêmito toracovocal","Percussão torácica","Ausculta vocal (egofonia, broncofonia)","Tempo expiratório forçado","Sinal de Hoover"]),
("Suspeita de AVC","Tempo é cérebro: reconheça, registre o horário de início e acione o serviço de urgência.",["Cincinnati (FAST) para AVC","Prova de Barré","Reflexos osteotendíneos","Sinal de Babinski","Prova dedo-nariz e calcanhar-joelho"]),
]

# ---------------- INTERPRETAÇÃO COMBINADA ----------------
# (nomes das manobras, mínimo de positivas, sugestão)
REGRAS = [
(["Teste de Lachman"],1,"Sugere lesão do ligamento cruzado anterior. Confirme com gaveta anterior e pivot shift; considere ressonância se houver indicação cirúrgica."),
(["Gaveta posterior"],1,"Sugere lesão do ligamento cruzado posterior."),
(["Estresse em valgo do joelho"],1,"Sugere lesão do ligamento colateral medial."),
(["Estresse em varo do joelho"],1,"Sugere lesão do ligamento colateral lateral ou do canto posterolateral."),
(["Teste de McMurray","Teste de Apley","Teste de Thessaly"],2,"Dois ou mais testes positivos tornam provável lesão meniscal."),
(["Teste de Neer","Teste de Hawkins-Kennedy"],2,"Neer e Hawkins-Kennedy positivos sugerem síndrome do impacto subacromial."),
(["Teste de Jobe","Teste de Patte","Lift-off de Gerber","Belly-press","Teste da queda do braço"],2,"Vários testes de força positivos sugerem lesão do manguito rotador; considere ultrassonografia ou ressonância."),
(["Teste de apreensão (anterior)"],1,"Sugere instabilidade anterior do ombro (luxação recidivante)."),
(["Teste de Phalen","Sinal de Tinel no carpo","Teste de Durkan"],2,"Dois ou mais testes positivos sugerem síndrome do túnel do carpo; confirme com eletroneuromiografia se necessário."),
(["Teste de Cozen","Teste de Mill"],1,"Sugere epicondilite lateral."),
(["Teste de Finkelstein"],1,"Sugere tenossinovite de De Quervain."),
(["Palpação da tabaqueira anatômica"],1,"Suspeita de fratura do escafoide: imobilizar e reavaliar com imagem, mesmo com radiografia inicial normal."),
(["Teste de Spurling","Teste de distração cervical","Sinal de Bakody"],2,"Sugere radiculopatia cervical."),
(["Sinal de Lhermitte","Sinal de Hoffmann","Sinal de Babinski"],2,"Sinais de neurônio motor superior/medula: considere mielopatia cervical e ressonância."),
(["Manobra de Lasègue","Lasègue cruzado","Sinal de Bragard"],2,"Sugere radiculopatia lombossacra (hérnia de disco); o Lasègue cruzado tem alta especificidade."),
(["Teste de Gaenslen","Teste de Patrick","Testes de provocação da sacroilíaca"],2,"Sugere dor de origem sacroilíaca."),
(["Teste de FADIR"],1,"Dor inguinal com FADIR positivo sugere impacto femoroacetabular; considere radiografia de bacia e do quadril."),
(["Sinal de Trendelenburg"],1,"Sugere fraqueza do glúteo médio (abdutores do quadril) do lado do apoio."),
(["Manobras de Ortolani e Barlow","Sinal de Galeazzi"],1,"Suspeita de displasia do desenvolvimento do quadril: solicitar ultrassom do quadril e encaminhar."),
(["Teste da compressão tibiofibular","Teste de rotação externa (Kleiger)"],1,"Sugere lesão da sindesmose (entorse alta); considere radiografia com carga e avaliação ortopédica."),
(["Gaveta anterior do tornozelo","Inversão forçada (talar tilt)"],1,"Sugere lesão dos ligamentos laterais do tornozelo (talofibular anterior e calcaneofibular)."),
(["Teste de Thompson"],1,"Sugere rotura do tendão de Aquiles: imobilização em equino e encaminhamento."),
(["Teste de Windlass"],1,"Sugere fascite plantar."),
(["Elevação unipodal do calcanhar"],1,"Sugere insuficiência do tendão tibial posterior."),
(["Rigidez de nuca","Sinal de Kernig","Sinal de Brudzinski"],1,"Sinal meníngeo positivo: suspeita de meningite ou hemorragia subaracnóidea; urgência."),
(["Ponto de McBurney","Sinal de Blumberg","Sinal de Rovsing","Sinal do psoas","Sinal do obturador"],2,"Dois ou mais sinais positivos aumentam a suspeita de apendicite: avaliação cirúrgica e imagem."),
(["Sinal de Murphy"],1,"Sugere colecistite aguda; correlacione com ultrassom."),
(["Manobra de Dix-Hallpike"],1,"Sugere VPPB do canal posterior; considere manobra de Epley."),
(["Hipotensão ortostática"],1,"Hipotensão ortostática: revise medicações, volume e causas neurogênicas."),
(["Cincinnati (FAST) para AVC"],1,"Sinal focal agudo: acione o serviço de urgência e registre o horário de início."),
]

# Manobras em que o lado (direito/esquerdo) importa
REGIOES_LATERAIS = {"Ombro", "Cotovelo", "Punho e mão", "Quadril", "Joelho", "Tornozelo e pé"}
NOMES_LATERAIS = {"Teste de Spurling", "Teste de distração cervical", "Sinal de Bakody", "Manobra de Lasègue", "Lasègue cruzado", "Sinal de Bragard",
    "Teste de estiramento femoral", "Teste de Slump", "Teste de Gaenslen", "Prova de Barré", "Sinal de Babinski", "Sinal de Hoffmann",
    "Reflexos osteotendíneos", "Graduação da força muscular", "Prova dedo-nariz e calcanhar-joelho", "Sinal de Godet", "Teste de Buerger",
    "Índice tornozelo-braquial", "Sinal de Stemmer", "Testes de Rinne e Weber", "Teste do impulso cefálico"}
NAO_LATERAIS = {"Medida do comprimento dos membros", "Regras de Ottawa do tornozelo"}

def slug(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def main():
    import os, glob
    saida, ids = [], {}
    for sis, reg, nome, alias, serve, como, positivo, obs in D:
        i = slug(nome)
        assert i not in ids, "nome duplicado: " + nome
        d = {"id": i, "s": sis, "r": reg, "n": nome, "a": alias, "p": serve, "c": como, "x": positivo, "o": obs}
        if (reg in REGIOES_LATERAIS or nome in NOMES_LATERAIS) and nome not in NAO_LATERAIS:
            d["l"] = 1
        imgs = sorted(glob.glob("assets/manobras/" + i + ".*"))
        if imgs:
            d["img"] = imgs[0]
        ids[i] = nome
        saida.append(d)
    def ref(nomes, onde):
        r = []
        for n in nomes:
            assert slug(n) in ids, "manobra inexistente em %s: %s" % (onde, n)
            r.append(slug(n))
        return r
    roteiros = [{"t": t, "d": dica, "m": ref(ms, t)} for t, dica, ms in ROTEIROS]
    regras = [{"m": ref(ms, s2), "n": mn, "t": txt} for ms, mn, txt in REGRAS for s2 in [txt[:30]]]
    json.dump({"manobras": saida, "roteiros": roteiros, "regras": regras}, open("data/manobras.json", "w"), ensure_ascii=False, separators=(",", ":"))
    ss = sorted({d["s"] for d in saida})
    print(len(saida), "manobras;", len(roteiros), "roteiros;", len(regras), "regras;", sum(1 for d in saida if d.get("l")), "laterais")

main()
