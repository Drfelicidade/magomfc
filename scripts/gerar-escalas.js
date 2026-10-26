// Gera as páginas das escalas e regras clínicas simples (CURB-65, Centor/McIsaac, CHA2DS2-VASc,
// PHQ-9, GAD-7, AUDIT-C, MDQ e Ottawa do tornozelo) a partir dos conteúdos definidos abaixo.
// Uso: node scripts/gerar-escalas.js
const fs = require('fs');
const raiz = __dirname + '/..';

// ---------- esqueleto comum ----------
function pagina({ arquivo, titulo, sub, hue, corpo, script, refs }) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; background-color: #f0f4f8; }
        input:focus-visible, select:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
    </style>
    <link rel="stylesheet" href="assets/tema-escuro.css" media="screen and (prefers-color-scheme: dark)">
    <script src="assets/tema.js"></script>
    <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">
    <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
</head>
<body class="bg-gray-100 min-h-screen p-4 md:p-8">
<main class="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
    <header class="bg-${hue}-700 p-6 md:p-8 text-white text-center">
        <h1 class="text-2xl md:text-4xl font-bold mb-2">${titulo}</h1>
        <p class="text-${hue}-100 text-sm md:text-base">${sub}</p>
        <a href="index.html" class="inline-flex items-center mt-5 px-5 py-2 bg-${hue}-800 hover:bg-${hue}-900 text-white text-sm font-medium rounded-full transition">&larr; Voltar ao Menu Principal</a>
    </header>
    <form id="form" class="p-6 md:p-8 space-y-6" onsubmit="return false">
${corpo}
        <div class="flex flex-wrap gap-3">
            <button type="button" id="btn-limpar" class="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition">Limpar</button>
        </div>
        <div id="resultado" class="hidden p-5 rounded-2xl border-2 space-y-2" role="status" aria-live="polite"></div>
        <details class="text-sm text-gray-600">
            <summary class="cursor-pointer font-semibold">Referências e observações</summary>
            <ul class="list-disc pl-5 mt-2 space-y-1">
${refs.map(r => '                <li>' + r + '</li>').join('\n')}
            </ul>
        </details>
    </form>
</main>
<script>
const $ = id => document.getElementById(id);
const CORES = {
    verde: 'bg-green-50 border-green-500 text-green-800',
    amarelo: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    laranja: 'bg-orange-50 border-orange-500 text-orange-800',
    vermelho: 'bg-red-50 border-red-500 text-red-800',
    azul: 'bg-blue-50 border-blue-500 text-blue-800',
    cinza: 'bg-gray-50 border-gray-300 text-gray-800'
};
function valorRadio(nome) {
    const el = document.querySelector('input[name="' + nome + '"]:checked');
    return el ? Number(el.value) : null;
}
function numero(id) {
    const v = $(id).value;
    return v === '' ? null : Number(v);
}
// Mostra o resultado; "linhas" são parágrafos (texto simples, sem HTML de terceiros)
function mostrar(cor, titulo, linhas, extras) {
    const r = $('resultado');
    r.className = 'p-5 rounded-2xl border-2 space-y-2 ' + CORES[cor];
    r.textContent = '';
    const h = document.createElement('p');
    h.className = 'text-2xl font-black';
    h.textContent = titulo;
    r.appendChild(h);
    (linhas || []).forEach(t => { const p = document.createElement('p'); p.className = 'text-sm font-medium'; p.textContent = t; r.appendChild(p); });
    (extras || []).forEach(x => {
        const p = document.createElement('p');
        p.className = 'text-sm font-bold mt-2 p-3 rounded-lg bg-red-100 text-red-900 border border-red-300';
        p.textContent = x; r.appendChild(p);
    });
}
function ocultar() { $('resultado').className = 'hidden'; }
function aviso(texto) {
    const r = $('resultado');
    r.className = 'p-4 rounded-2xl border-2 ' + CORES.cinza;
    r.textContent = texto;
}
$('form').addEventListener('input', () => atualizar());
$('form').addEventListener('change', () => atualizar());
$('btn-limpar').addEventListener('click', () => { $('form').reset(); ocultar(); });
${script}
</script>
<script src="assets/aviso.js" defer></script>
<script src="assets/apoio.js" defer></script>
<script src="assets/contato.js" defer></script>
</body>
</html>
`;
  fs.writeFileSync(`${raiz}/${arquivo}`, html);
  console.log('gerado', arquivo);
}

// ---------- componentes ----------
const check = (id, txt, ajuda) => `        <label class="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" id="${id}" class="w-5 h-5 mt-0.5 shrink-0">
            <span><span class="font-medium text-gray-800">${txt}</span>${ajuda ? `<span class="block text-sm text-gray-500">${ajuda}</span>` : ''}</span>
        </label>`;
const radio = (nome, rotulo, ops, ajuda) => `        <fieldset class="space-y-1">
            <legend class="font-semibold text-gray-800">${rotulo}</legend>${ajuda ? `\n            <p class="text-sm text-gray-500">${ajuda}</p>` : ''}
${ops.map(([t, v]) => `            <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"><input type="radio" name="${nome}" value="${v}" class="w-5 h-5 shrink-0"> <span>${t}</span></label>`).join('\n')}
        </fieldset>`;
const num = (id, rotulo, ajuda, extra) => `        <div>
            <label for="${id}" class="block font-semibold text-gray-800 mb-1">${rotulo}</label>
            <input type="number" id="${id}" inputmode="decimal" ${extra || ''} class="w-full p-3 border border-gray-300 rounded-xl text-lg">${ajuda ? `\n            <p class="text-sm text-gray-500 mt-1">${ajuda}</p>` : ''}
        </div>`;
const nota = txt => `        <p class="text-sm p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">${txt}</p>`;

const FREQ = [['Nenhuma vez', 0], ['Vários dias', 1], ['Mais da metade dos dias', 2], ['Quase todos os dias', 3]];

// ======================= CURB-65 =======================
pagina({
  arquivo: 'calculadora-curb65.html',
  titulo: 'Calculadora CURB-65',
  sub: 'Gravidade da pneumonia adquirida na comunidade e local de tratamento',
  hue: 'sky',
  corpo: [
    check('conf', 'Confusão mental (desorientação nova no tempo, no espaço ou na pessoa)'),
    num('ureia', 'Ureia (mg/dL)', 'Ponto se acima de 50 mg/dL (critério das diretrizes brasileiras). O critério original é ureia acima de 7 mmol/L (cerca de 42 mg/dL), o que equivale a BUN acima de 19 mg/dL.', 'min="0"'),
    num('fr', 'Frequência respiratória (irpm)', 'Ponto se 30 ou mais.', 'min="0"'),
    num('pas', 'Pressão arterial sistólica (mmHg)', 'Ponto se sistólica abaixo de 90 mmHg ou diastólica igual ou abaixo de 60 mmHg.', 'min="0"'),
    num('pad', 'Pressão arterial diastólica (mmHg)', '', 'min="0"'),
    num('idade', 'Idade (anos)', 'Ponto se 65 anos ou mais.', 'min="0" max="120"'),
    nota('Uso em pneumonia adquirida na comunidade confirmada ou suspeita, em adultos. O escore ajuda, mas não substitui o julgamento clínico: saturação de O₂ abaixo de 90%, comorbidade descompensada, incapacidade de usar via oral e fatores sociais também pesam na decisão de internar.')
  ].join('\n'),
  script: `
function atualizar() {
    const conf = $('conf').checked ? 1 : 0;
    const ureia = numero('ureia'), fr = numero('fr'), pas = numero('pas'), pad = numero('pad'), idade = numero('idade');
    const u = ureia !== null && ureia > 50 ? 1 : 0;
    const r = fr !== null && fr >= 30 ? 1 : 0;
    const b = (pas !== null && pas < 90) || (pad !== null && pad <= 60) ? 1 : 0;
    const i = idade !== null && idade >= 65 ? 1 : 0;
    const faltam = [];
    if (ureia === null) faltam.push('ureia');
    if (fr === null) faltam.push('frequência respiratória');
    if (pas === null && pad === null) faltam.push('pressão arterial');
    if (idade === null) faltam.push('idade');
    if (faltam.length === 4 && !conf) { ocultar(); return; }
    const crb = conf + r + b + i;
    const total = crb + u;
    let cor, titulo, txt;
    if (total <= 1) { cor = 'verde'; titulo = 'CURB-65: ' + total + ' ponto(s), baixo risco'; txt = 'Mortalidade em 30 dias de cerca de 1,5%. Em geral, tratamento ambulatorial, se não houver hipoxemia, comorbidade descompensada, fatores sociais desfavoráveis ou incapacidade de usar via oral.'; }
    else if (total === 2) { cor = 'amarelo'; titulo = 'CURB-65: 2 pontos, risco intermediário'; txt = 'Mortalidade de cerca de 9%. Considerar internação (mesmo que curta) ou seguimento hospitalar.'; }
    else { cor = 'vermelho'; titulo = 'CURB-65: ' + total + ' pontos, alto risco'; txt = 'Mortalidade de cerca de 22% ou mais. Indicar internação; com 4 ou 5 pontos, avaliar UTI.'; }
    const linhas = [txt, 'Critérios: confusão ' + conf + ', ureia ' + u + ', FR ' + r + ', PA ' + b + ', idade ' + i + '.',
        'CRB-65 (sem ureia, útil quando não há exame): ' + crb + ' ponto(s). ' + (crb === 0 ? 'Baixo risco, tratamento domiciliar provável.' : crb <= 2 ? 'Considerar encaminhamento hospitalar.' : 'Risco alto, encaminhar com urgência.')];
    if (faltam.length) linhas.push('Campos não preenchidos (contam como zero): ' + faltam.join(', ') + '.');
    mostrar(cor, titulo, linhas);
}`,
  refs: [
    'Lim WS et al. Thorax 2003;58:377-82 (escore original) e diretrizes da British Thoracic Society.',
    'Diretrizes brasileiras para pneumonia adquirida na comunidade em adultos imunocompetentes (SBPT, 2009): ureia acima de 50 mg/dL.',
    'As taxas de mortalidade são aproximadas e vêm da validação original; variam entre populações.'
  ]
});

// ======================= Centor / McIsaac =======================
pagina({
  arquivo: 'calculadora-centor-mcisaac.html',
  titulo: 'Centor modificado (McIsaac)',
  sub: 'Probabilidade de faringoamigdalite estreptocócica em pacientes com dor de garganta',
  hue: 'amber',
  corpo: [
    check('exsudato', 'Exsudato ou edema nas amígdalas'),
    check('linfonodo', 'Linfonodos cervicais anteriores dolorosos ou aumentados'),
    check('febre', 'Febre (história de temperatura acima de 38 °C)'),
    check('semtosse', 'Ausência de tosse'),
    radio('idade', 'Faixa etária', [['3 a 14 anos (+1)', 1], ['15 a 44 anos (0)', 0], ['45 anos ou mais (−1)', -1]], 'O escore não se aplica a menores de 3 anos.'),
    nota('Aplicar em pacientes com dor de garganta aguda. Não use para quem tem sinais de infecção viral evidente (coriza, rouquidão, conjuntivite, úlceras orais) como decisão isolada, nem para suspeita de abscesso ou complicação.')
  ].join('\n'),
  script: `
function atualizar() {
    const idade = valorRadio('idade');
    if (idade === null) { aviso('Selecione a faixa etária para calcular.'); return; }
    const total = ['exsudato', 'linfonodo', 'febre', 'semtosse'].filter(id => $(id).checked).length + idade;
    let cor, prob, conduta;
    if (total <= 0) { cor = 'verde'; prob = '1 a 2,5%'; conduta = 'Não testar nem prescrever antibiótico.'; }
    else if (total === 1) { cor = 'verde'; prob = '5 a 10%'; conduta = 'Não testar nem prescrever antibiótico.'; }
    else if (total === 2) { cor = 'amarelo'; prob = '11 a 17%'; conduta = 'Testar (teste rápido ou cultura) e tratar apenas se positivo.'; }
    else if (total === 3) { cor = 'laranja'; prob = '28 a 35%'; conduta = 'Testar e tratar se positivo; considerar tratamento empírico se o teste não estiver disponível.'; }
    else { cor = 'vermelho'; prob = '51 a 53%'; conduta = 'Testar; considerar antibiótico empírico se o teste não estiver disponível.'; }
    mostrar(cor, 'Escore ' + total + ': probabilidade de estreptococo de ' + prob, [conduta,
        'Se tratar, a penicilina benzatina intramuscular em dose única ou a amoxicilina por via oral por 10 dias são as opções habituais; evite antibiótico para dor de garganta sem indicação.']);
}`,
  refs: [
    'McIsaac WJ et al. CMAJ 1998;158:75-83 e JAMA 2004;291:1587-95 (probabilidades por escore).',
    'IDSA (Shulman 2012): não tratar empiricamente sem teste positivo, quando o teste está disponível.',
    'Faringite estreptocócica é autolimitada; o tratamento reduz a duração dos sintomas e previne febre reumática.'
  ]
});

// ======================= CHA2DS2-VASc =======================
pagina({
  arquivo: 'calculadora-chads-vasc.html',
  titulo: 'Calculadora CHA₂DS₂-VASc',
  sub: 'Risco de AVC em fibrilação atrial não valvar e indicação de anticoagulação',
  hue: 'rose',
  corpo: [
    radio('sexo', 'Sexo', [['Masculino', 'M'], ['Feminino (+1)', 'F']]),
    radio('idade', 'Idade', [['Menos de 65 anos (0)', 0], ['65 a 74 anos (+1)', 1], ['75 anos ou mais (+2)', 2]]),
    check('icc', 'Insuficiência cardíaca ou disfunção ventricular esquerda (+1)'),
    check('has', 'Hipertensão arterial (+1)'),
    check('dm', 'Diabetes mellitus (+1)'),
    check('avc', 'AVC, AIT ou tromboembolismo prévio (+2)'),
    check('vasc', 'Doença vascular (infarto prévio, doença arterial periférica ou placa aórtica) (+1)'),
    nota('Vale para fibrilação atrial não valvar. Com estenose mitral moderada a grave ou prótese valvar mecânica, a anticoagulação com varfarina está indicada independentemente do escore. Veja também a <a class="underline" href="calculadora-has-bled.html">calculadora HAS-BLED</a>.')
  ].join('\n'),
  script: `
function atualizar() {
    const sexo = document.querySelector('input[name="sexo"]:checked');
    const idade = valorRadio('idade');
    if (!sexo || idade === null) { aviso('Selecione o sexo e a idade para calcular.'); return; }
    const fem = sexo.value === 'F' ? 1 : 0;
    const comorb = ($('icc').checked ? 1 : 0) + ($('has').checked ? 1 : 0) + ($('dm').checked ? 1 : 0) + ($('avc').checked ? 2 : 0) + ($('vasc').checked ? 1 : 0);
    const semSexo = comorb + idade;
    const total = semSexo + fem;
    let cor, titulo, txt;
    if (semSexo === 0) { cor = 'verde'; titulo = 'Baixo risco'; txt = 'Anticoagulação não é recomendada (sem fatores de risco além do sexo).'; }
    else if (semSexo === 1) { cor = 'amarelo'; titulo = 'Risco intermediário'; txt = 'Considerar anticoagulação oral, avaliando risco de sangramento e a preferência do paciente.'; }
    else { cor = 'vermelho'; titulo = 'Alto risco'; txt = 'Anticoagulação oral recomendada, salvo contraindicação. Os anticoagulantes diretos são preferidos à varfarina na FA não valvar.'; }
    mostrar(cor, 'CHA₂DS₂-VASc: ' + total + ' ponto(s). ' + titulo, [txt,
        'O sexo feminino conta ponto, mas isoladamente não indica anticoagulação: a decisão usa o escore sem o ponto do sexo (' + semSexo + ').',
        'Antes de iniciar, calcule o risco de sangramento (HAS-BLED) e corrija os fatores modificáveis (pressão, álcool, AINEs).']);
}`,
  refs: [
    'Lip GYH et al. Chest 2010;137:263-72 (escore original).',
    'Diretriz de Fibrilação Atrial da ESC 2020 (recomendação por escore e sexo) e Diretriz Brasileira de Fibrilação Atrial (SBC).',
    'A ESC 2024 propõe o CHA₂DS₂-VA (sem o critério de sexo); nesta calculadora o critério de decisão já desconta o ponto do sexo.'
  ]
});

// ======================= PHQ-9 =======================
const PHQ = [
  'Pouco interesse ou pouco prazer em fazer as coisas',
  'Se sentir para baixo, deprimido(a) ou sem perspectiva',
  'Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que o costume',
  'Se sentir cansado(a) ou com pouca energia',
  'Falta de apetite ou comer demais',
  'Se sentir mal consigo mesmo(a), ou achar que é um fracasso ou que decepcionou a família ou a si mesmo(a)',
  'Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão',
  'Lentidão para se movimentar ou falar, a ponto de outras pessoas perceberem, ou o oposto: estar tão agitado(a) ou inquieto(a) que fica andando de um lado para o outro muito mais do que de costume',
  'Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)'
];
pagina({
  arquivo: 'questionario-phq9.html',
  titulo: 'Questionário PHQ-9',
  sub: 'Rastreio e gravidade de sintomas depressivos',
  hue: 'indigo',
  corpo: [
    '        <p class="text-gray-700">Nas <strong>últimas 2 semanas</strong>, com que frequência o(a) paciente foi incomodado(a) por cada problema abaixo?</p>',
    ...PHQ.map((t, i) => radio('q' + (i + 1), (i + 1) + '. ' + t, FREQ)),
    radio('func', 'Se algum problema foi assinalado, o quanto ele dificultou o trabalho, as tarefas de casa ou o convívio com as pessoas? (não entra no escore)',
      [['Nenhuma dificuldade', 0], ['Alguma dificuldade', 1], ['Muita dificuldade', 2], ['Extrema dificuldade', 3]]),
    nota('O PHQ-9 é uma ferramenta de rastreio e acompanhamento: o diagnóstico de depressão é clínico. Antes de iniciar antidepressivo, pergunte sobre episódios de mania ou hipomania; o <a class="underline" href="questionario-mdq.html">MDQ</a> ajuda a rastrear o espectro bipolar.')
  ].join('\n'),
  script: `
function atualizar() {
    let total = 0, respondidas = 0;
    for (let i = 1; i <= 9; i++) { const v = valorRadio('q' + i); if (v !== null) { total += v; respondidas++; } }
    if (respondidas === 0) { ocultar(); return; }
    if (respondidas < 9) { aviso(respondidas + ' de 9 perguntas respondidas. Responda todas para ver o resultado.'); return; }
    let cor, faixa, conduta;
    if (total <= 4) { cor = 'verde'; faixa = 'Sintomas mínimos'; conduta = 'Em geral não requer tratamento; reavaliar se houver queixa.'; }
    else if (total <= 9) { cor = 'verde'; faixa = 'Depressão leve'; conduta = 'Conduta expectante com reavaliação, orientação e medidas de apoio; considerar psicoterapia.'; }
    else if (total <= 14) { cor = 'amarelo'; faixa = 'Depressão moderada'; conduta = 'Plano de tratamento com psicoterapia e/ou antidepressivo, com seguimento próximo.'; }
    else if (total <= 19) { cor = 'laranja'; faixa = 'Depressão moderadamente grave'; conduta = 'Tratamento ativo com antidepressivo e/ou psicoterapia; considerar apoio matricial ou encaminhamento.'; }
    else { cor = 'vermelho'; faixa = 'Depressão grave'; conduta = 'Iniciar tratamento sem demora e encaminhar ao serviço especializado (CAPS ou psiquiatria).'; }
    const linhas = [conduta, 'Pontuação de 10 ou mais sugere depressão maior provável (sensibilidade e especificidade cerca de 88%), a confirmar clinicamente.'];
    const extras = [];
    if (valorRadio('q9') > 0) extras.push('Item 9 positivo: avalie o risco de suicídio hoje (ideação, plano, meios, tentativas prévias), faça plano de segurança e restrinja o acesso a meios letais. Apoio: CVV 188 (24 h) e SAMU 192 em emergência.');
    mostrar(cor, 'PHQ-9: ' + total + ' de 27. ' + faixa, linhas, extras);
}`,
  refs: [
    'Kroenke K, Spitzer RL, Williams JB. J Gen Intern Med 2001;16:606-13.',
    'Validação brasileira: Santos IS et al. Cad Saude Publica 2013;29:1533-43.',
    'Faixas de gravidade: 0-4, 5-9, 10-14, 15-19 e 20-27. Item 9 positivo exige avaliação de risco de suicídio, qualquer que seja o total.'
  ]
});

// ======================= GAD-7 =======================
const GAD = [
  'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)',
  'Não ser capaz de impedir ou de controlar as preocupações',
  'Preocupar-se muito com diversas coisas',
  'Dificuldade para relaxar',
  'Ficar tão agitado(a) que se torna difícil permanecer sentado(a)',
  'Ficar facilmente aborrecido(a) ou irritado(a)',
  'Sentir medo como se algo horrível fosse acontecer'
];
pagina({
  arquivo: 'questionario-gad7.html',
  titulo: 'Questionário GAD-7',
  sub: 'Rastreio e gravidade de ansiedade generalizada',
  hue: 'violet',
  corpo: [
    '        <p class="text-gray-700">Nas <strong>últimas 2 semanas</strong>, com que frequência o(a) paciente foi incomodado(a) por cada problema abaixo?</p>',
    ...GAD.map((t, i) => radio('q' + (i + 1), (i + 1) + '. ' + t, FREQ)),
    radio('func', 'Se algum problema foi assinalado, o quanto ele dificultou o trabalho, as tarefas de casa ou o convívio com as pessoas? (não entra no escore)',
      [['Nenhuma dificuldade', 0], ['Alguma dificuldade', 1], ['Muita dificuldade', 2], ['Extrema dificuldade', 3]]),
    nota('O GAD-7 rastreia transtorno de ansiedade generalizada e também detecta transtorno de pânico, fobia social e estresse pós-traumático. Ansiedade pode ter causas orgânicas (tireoide, cafeína, medicamentos, álcool): investigue. Veja também o <a class="underline" href="questionario-phq9.html">PHQ-9</a>.')
  ].join('\n'),
  script: `
function atualizar() {
    let total = 0, respondidas = 0;
    for (let i = 1; i <= 7; i++) { const v = valorRadio('q' + i); if (v !== null) { total += v; respondidas++; } }
    if (respondidas === 0) { ocultar(); return; }
    if (respondidas < 7) { aviso(respondidas + ' de 7 perguntas respondidas. Responda todas para ver o resultado.'); return; }
    let cor, faixa, conduta;
    if (total <= 4) { cor = 'verde'; faixa = 'Ansiedade mínima'; conduta = 'Sem indicação de tratamento; reavaliar se houver queixa.'; }
    else if (total <= 9) { cor = 'verde'; faixa = 'Ansiedade leve'; conduta = 'Orientação, medidas de manejo do estresse e reavaliação.'; }
    else if (total <= 14) { cor = 'amarelo'; faixa = 'Ansiedade moderada'; conduta = 'Avaliação clínica para confirmar o transtorno; considerar psicoterapia e/ou tratamento medicamentoso.'; }
    else { cor = 'laranja'; faixa = 'Ansiedade grave'; conduta = 'Tratamento ativo e seguimento próximo; considerar encaminhamento ao serviço especializado.'; }
    mostrar(cor, 'GAD-7: ' + total + ' de 21. ' + faixa, [conduta,
        'Pontuação de 10 ou mais é o ponto de corte para avaliação adicional (sensibilidade 89% e especificidade 82% para ansiedade generalizada), a confirmar clinicamente.',
        'Investigue causas orgânicas, uso de substâncias e depressão associada (PHQ-9).']);
}`,
  refs: [
    'Spitzer RL et al. Arch Intern Med 2006;166:1092-7.',
    'Kroenke K et al. Ann Intern Med 2007;146:317-25 (uso na atenção primária). Há versão validada para o português do Brasil (Moreno AL et al., 2016).',
    'Faixas: 0-4 mínima, 5-9 leve, 10-14 moderada e 15-21 grave.'
  ]
});

// ======================= MDQ =======================
// Texto: versão brasileira validada (B-MDQ), apêndice de Castelo MS et al., Rev Bras Psiquiatr 2010 (acesso aberto, CC BY).
// O item 9 (mais ativo / fez mais coisas) não consta do apêndice publicado: texto adaptado da tradução usada em
// Soares OT (tese, USP, 2010), no estilo verbal do restante da versão. Marcado com * na página.
const MDQ = [
  'você se sentia tão bem ou tão para cima a ponto das outras pessoas pensarem que você não estava no seu jeito normal, ou você estava tão para cima a ponto de se envolver em problemas?',
  'você ficava tão irritado a ponto de gritar com as pessoas ou começava brigas ou discussões?',
  'você se sentia muito mais confiante em você mesmo do que o normal?',
  'você dormia menos que de costume e nem sequer sentia falta do sono?',
  'você falava muito mais ou falava mais rápido que o seu normal?',
  'os pensamentos corriam rapidamente em sua cabeça ou você não conseguia acalmar sua mente?',
  'você se distraía com tanta facilidade com as coisas ao seu redor, a ponto de ter dificuldade em manter a concentração ou o foco em uma atividade?',
  'você se sentia com muito mais energia que o seu normal?',
  'você ficava muito mais ativo ou fazia muito mais coisas do que o seu normal? *',
  'você ficava mais dado com as pessoas e mais expansivo que o seu normal, por exemplo, telefonava para os amigos no meio da noite?',
  'você ficava mais interessado em sexo que o normal?',
  'você fazia coisas que não eram comuns para você ou que faziam outras pessoas pensarem que você era exagerado, bobo ou se arriscava mais?',
  'gastar dinheiro causava problemas para você ou para sua família?'
];
pagina({
  arquivo: 'questionario-mdq.html',
  titulo: 'Questionário MDQ (Transtorno Bipolar)',
  sub: 'Questionário de Transtornos do Humor (MDQ): rastreio de transtorno do espectro bipolar, versão brasileira validada',
  hue: 'purple',
  corpo: [
    nota('Instrumento de <strong>rastreio</strong>, não de diagnóstico. Texto da <strong>versão brasileira validada</strong> (B-MDQ; Castelo et al., 2010). Marque os itens em que o(a) paciente respondeu <strong>sim</strong>.'),
    '        <p class="text-gray-700"><strong>Pergunta 1.</strong> Já ocorreu algum período na sua vida em que seu jeito de ser mudou? E que…</p>',
    ...MDQ.map((t, i) => check('s' + (i + 1), (i + 1) + '. … ' + t)),
    radio('simult', 'Pergunta 2. Se você marcou SIM em mais de uma das perguntas acima, várias delas ocorreram durante o mesmo período de tempo?', [['Sim', 1], ['Não', 0]], 'Só é necessária se houver 7 ou mais itens marcados.'),
    radio('impacto', 'Pergunta 3. Até que ponto o problema o afetou, como sentir-se incapaz de trabalhar, ter dificuldades com a família, com dinheiro ou problemas com a justiça, envolver-se em discussões ou brigas?', [['Nenhum problema', 0], ['Problema pouco grave', 1], ['Problema mais ou menos grave', 2], ['Problema muito grave', 3]], 'Só é necessária se houver 7 ou mais itens marcados. Para os critérios originais, «mais ou menos grave» e «muito grave» correspondem a problema moderado ou sério.'),
    '        <p class="text-gray-700"><strong>Informações complementares</strong> (fora do instrumento e do escore):</p>',
    check('fam', 'Parente consanguíneo com transtorno bipolar (maníaco-depressivo)'),
    check('diag', 'Já recebeu o diagnóstico de transtorno bipolar de um profissional de saúde')
  ].join('\n'),
  script: `
function atualizar() {
    let n = 0;
    for (let i = 1; i <= 13; i++) if ($('s' + i).checked) n++;
    const simult = valorRadio('simult'), impacto = valorRadio('impacto');
    if (n === 0 && simult === null && impacto === null && !$('fam').checked && !$('diag').checked) { ocultar(); return; }
    const br = n >= 8;
    const fam = $('fam').checked ? ' História familiar de transtorno bipolar.' : '';
    const diag = $('diag').checked ? ' Diagnóstico prévio de transtorno bipolar referido.' : '';
    const pre = 'MDQ (versão brasileira): ' + n + '/13 sintomas';
    const nomesImp = ['nenhum problema', 'problema pouco grave', 'problema mais ou menos grave', 'problema muito grave'];
    const linhaBr = 'Corte da versão brasileira validada (8 ou mais itens): ' + (br ? 'atingido' : 'não atingido') + '.';
    const desempenho = 'Na validação brasileira (ambulatório psiquiátrico, n = 114), o corte de 8 ou mais itens teve sensibilidade de 0,91 e especificidade de 0,70. O desempenho na atenção primária ainda não foi determinado.';
    const condutaPos = 'Sugere transtorno do espectro bipolar, a confirmar com entrevista clínica (história de mania ou hipomania, episódios depressivos, história familiar, uso de substâncias). Não é diagnóstico. Se houver depressão atual, investigue mania ou hipomania antes de prescrever antidepressivo e avalie também depressão, ansiedade (PHQ-9, GAD-7) e risco de suicídio.';
    if (n < 7) {
        mostrar('verde', 'MDQ: ' + n + ' de 13 sintomas. Rastreio negativo', [
            'Menos de 7 sintomas: nem o corte da versão brasileira (8 ou mais itens) nem os critérios originais (7 ou mais itens) são atingidos. As perguntas 2 e 3 não alteram o resultado.',
            'Um rastreio negativo não exclui o transtorno, principalmente se a suspeita clínica for alta: na população geral a sensibilidade do MDQ foi de apenas 0,28.',
            'Resumo: ' + pre + '; rastreio negativo.' + fam + diag
        ]);
        return;
    }
    if (simult === null || impacto === null) {
        if (br) {
            mostrar('laranja', 'MDQ: ' + n + ' de 13 sintomas. Rastreio positivo pelo corte brasileiro', [
                linhaBr + ' Responda as perguntas 2 e 3 para verificar também os critérios originais (mesmo período e problema moderado ou sério).',
                condutaPos, desempenho,
                'Resumo: ' + pre + '; corte brasileiro (8 ou mais) atingido; perguntas 2 e 3 não preenchidas.' + fam + diag
            ]);
        } else {
            aviso(n + ' sintomas marcados (7 ou mais). Responda a pergunta 2 (mesmo período) e a pergunta 3 (problemas causados) para concluir.');
        }
        return;
    }
    const c2 = simult === 1, c3 = impacto >= 2, orig = c2 && c3;
    const falhas = [];
    if (!c2) falhas.push('os sintomas não ocorreram no mesmo período');
    if (!c3) falhas.push('o problema causado foi ' + (impacto === 0 ? 'nenhum' : 'pouco grave'));
    if (br && orig) {
        mostrar('laranja', 'MDQ: ' + n + ' de 13 sintomas. Rastreio positivo', [
            'O corte da versão brasileira (8 ou mais itens) e os critérios originais (7 ou mais itens, no mesmo período, com ' + nomesImp[impacto] + ') foram atendidos.',
            condutaPos, desempenho,
            'Resumo: ' + pre + '; sintomas no mesmo período; ' + nomesImp[impacto] + '; rastreio positivo (corte brasileiro e critérios originais).' + fam + diag
        ]);
    } else if (br) {
        mostrar('laranja', 'MDQ: ' + n + ' de 13 sintomas. Rastreio positivo pelo corte brasileiro', [
            linhaBr + ' Os critérios originais não foram atendidos: ' + falhas.join('; ') + '.',
            condutaPos, desempenho,
            'Resumo: ' + pre + '; corte brasileiro (8 ou mais) atingido; critérios originais não atendidos (' + falhas.join('; ') + ').' + fam + diag
        ]);
    } else if (orig) {
        mostrar('laranja', 'MDQ: ' + n + ' de 13 sintomas. Rastreio positivo pelos critérios originais', [
            'Os critérios originais foram atendidos (7 sintomas, no mesmo período, com ' + nomesImp[impacto] + '), mas o corte da versão brasileira (8 ou mais itens) não foi atingido.',
            condutaPos,
            'Resumo: ' + pre + '; critérios originais atendidos; corte brasileiro não atingido.' + fam + diag
        ]);
    } else {
        mostrar('amarelo', 'MDQ: ' + n + ' de 13 sintomas. Rastreio negativo pelos critérios completos', [
            'Há 7 sintomas, mas: ' + falhas.join('; ') + '. ' + linhaBr,
            'Se a suspeita clínica persistir, avalie o histórico de humor e reaplique o questionário em outro momento.',
            'Resumo: ' + pre + '; ' + falhas.join('; ') + '; rastreio negativo.' + fam + diag
        ]);
    }
}`,
  refs: [
    'Versão brasileira validada: Castelo MS, Carvalho ER, Gerhard ES, Costa CMC, Ferreira ED, Carvalho AF. Validity of the Mood Disorder Questionnaire in a Brazilian psychiatric population. Rev Bras Psiquiatr 2010 (acesso aberto, licença CC BY; PMID 21308264). Amostra: 114 pacientes de ambulatório psiquiátrico, padrão-ouro SCID. Melhor ponto de corte: 8 ou mais itens (sensibilidade 0,91; especificidade 0,70; VPP 0,82; VPN 0,84). Os autores indicam que falta validação em outros contextos, como a atenção primária. O texto das perguntas foi transcrito do apêndice do artigo (imagem de baixa resolução): confira com o original.',
    '* O item 9 (muito mais ativo ou fazendo muito mais coisas) é citado no artigo (fator energia-atividade), mas não aparece no apêndice publicado. O texto foi adaptado da tradução usada em Soares OT (tese, USP, 2010), no estilo do restante da versão.',
    'Instrumento original: Hirschfeld RM et al. Am J Psychiatry 2000;157:1873-5. Rastreio positivo: 7 ou mais sintomas (pergunta 1), no mesmo período (pergunta 2) e com problema moderado ou sério (pergunta 3); sensibilidade 0,73 e especificidade 0,90 em pacientes psiquiátricos. © University of Texas Medical Branch.',
    'Na população geral, o MDQ teve boa especificidade (0,97), mas sensibilidade baixa (0,28): Hirschfeld RM et al. Am J Psychiatry 2003;160:178-80. Por isso, um resultado negativo não afasta o transtorno bipolar.',
    'O MDQ rastreia o espectro bipolar ao longo da vida; pode haver resultados falso-positivos em outras condições com impulsividade, irritabilidade e instabilidade afetiva (por exemplo, TDAH e transtorno de personalidade borderline).'
  ]
});

// ======================= AUDIT-C =======================
pagina({
  arquivo: 'questionario-audit-c.html',
  titulo: 'Questionário AUDIT-C',
  sub: 'Triagem breve de uso de risco de álcool',
  hue: 'orange',
  corpo: [
    radio('sexo', 'Sexo', [['Masculino', 'M'], ['Feminino', 'F']]),
    radio('q1', '1. Com que frequência o(a) paciente consome bebidas que contêm álcool?',
      [['Nunca', 0], ['Uma vez por mês ou menos', 1], ['2 a 4 vezes por mês', 2], ['2 a 3 vezes por semana', 3], ['4 ou mais vezes por semana', 4]]),
    radio('q2', '2. Quantas doses contendo álcool consome em um dia normal?',
      [['1 ou 2', 0], ['3 ou 4', 1], ['5 ou 6', 2], ['7 a 9', 3], ['10 ou mais', 4]],
      'Uma dose equivale a cerca de 10 a 12 g de álcool: uma lata de cerveja (350 mL), uma taça pequena de vinho (100 a 150 mL) ou uma dose de destilado (30 a 40 mL).'),
    radio('q3', '3. Com que frequência consome seis ou mais doses em uma única ocasião?',
      [['Nunca', 0], ['Menos de uma vez por mês', 1], ['Mensalmente', 2], ['Semanalmente', 3], ['Todos ou quase todos os dias', 4]]),
    nota('Triagem, não diagnóstico. Se o paciente relata que nunca bebe (pergunta 1), as demais perguntas valem zero.')
  ].join('\n'),
  script: `
function atualizar() {
    const sexo = document.querySelector('input[name="sexo"]:checked');
    const q1 = valorRadio('q1'), q2 = valorRadio('q2'), q3 = valorRadio('q3');
    if (q1 === null && q2 === null && q3 === null) { ocultar(); return; }
    if (q1 === null || q2 === null || q3 === null || !sexo) { aviso('Responda o sexo e as 3 perguntas para ver o resultado.'); return; }
    const total = q1 + q2 + q3;
    const corte = sexo.value === 'M' ? 4 : 3;
    if (total >= corte) {
        mostrar(total >= 8 ? 'vermelho' : 'laranja', 'AUDIT-C: ' + total + ' de 12. Triagem positiva', [
            'Ponto de corte para ' + (sexo.value === 'M' ? 'homens: 4 ou mais' : 'mulheres: 3 ou mais') + '.',
            'Conduta: aplicar o AUDIT completo (10 perguntas), avaliar padrão de uso, dependência e danos, e oferecer intervenção breve. Investigar comorbidades, medicações e sinais de abstinência.',
            total >= 8 ? 'Pontuação de 8 ou mais sugere uso de risco elevado: avaliar dependência e necessidade de tratamento especializado (CAPS-AD).' : 'Reavaliar em consulta de seguimento.']);
    } else {
        mostrar('verde', 'AUDIT-C: ' + total + ' de 12. Triagem negativa', [
            'Abaixo do ponto de corte (' + corte + ') para ' + (sexo.value === 'M' ? 'homens' : 'mulheres') + '.',
            'Reforçar o consumo de baixo risco e repetir a triagem periodicamente. Gestantes, adolescentes e pessoas em uso de medicações que interagem com álcool devem evitar qualquer consumo.']);
    }
}`,
  refs: [
    'Bush K et al. Arch Intern Med 1998;158:1789-95 (AUDIT-C).',
    'Pontos de corte: 4 para homens e 3 para mulheres (Bradley KA et al. Alcohol Clin Exp Res 2007;31:1208-17).',
    'AUDIT completo: Babor TF et al., OMS. Versão brasileira validada por Lima CT et al. (2005).'
  ]
});

// ======================= Ottawa tornozelo =======================
pagina({
  arquivo: 'regras-ottawa-tornozelo.html',
  titulo: 'Regras de Ottawa do tornozelo e do pé',
  sub: 'Quando pedir radiografia após trauma de tornozelo ou médio-pé',
  hue: 'teal',
  corpo: [
    '        <div class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2"><p class="font-bold">Antes de aplicar, confirme que não há nenhum destes fatores (as regras não valem):</p>',
    check('ex1', 'Intoxicação, rebaixamento da consciência ou déficit neurológico'),
    check('ex2', 'Lesões dolorosas associadas que distraiam a atenção (múltiplas lesões)'),
    check('ex3', 'Gestante, ou lesão com mais de 10 dias'),
    check('ex4', 'Menor de 5 anos, ou suspeita de fratura exposta, luxação ou fratura já conhecida'),
    '        </div>',
    '        <p class="font-semibold text-gray-800">Região da dor</p>',
    radio('zona', 'Onde está a dor?', [['Zona maleolar (tornozelo)', 'tornozelo'], ['Zona do médio-pé', 'pe'], ['As duas regiões', 'ambas']]),
    '        <div id="crit-tornozelo" class="space-y-3"><p class="font-semibold text-gray-800">Tornozelo</p>',
    check('t1', 'Dor à palpação óssea na borda posterior ou na ponta do maléolo lateral (últimos 6 cm distais)'),
    check('t2', 'Dor à palpação óssea na borda posterior ou na ponta do maléolo medial (últimos 6 cm distais)'),
    check('t3', 'Incapacidade de dar 4 passos, logo após a lesão e no exame', 'Passos com carga: mesmo mancando conta como capaz de andar.'),
    '        </div>',
    '        <div id="crit-pe" class="space-y-3"><p class="font-semibold text-gray-800">Médio-pé</p>',
    check('p1', 'Dor à palpação óssea na base do 5º metatarso'),
    check('p2', 'Dor à palpação óssea do osso navicular'),
    check('p3', 'Incapacidade de dar 4 passos, logo após a lesão e no exame'),
    '        </div>'
  ].join('\n'),
  script: `
function atualizar() {
    const zona = document.querySelector('input[name="zona"]:checked');
    if (!zona) { aviso('Selecione a região da dor.'); return; }
    $('crit-tornozelo').classList.toggle('hidden', zona.value === 'pe');
    $('crit-pe').classList.toggle('hidden', zona.value === 'tornozelo');
    if (['ex1', 'ex2', 'ex3', 'ex4'].some(id => $(id).checked)) {
        mostrar('amarelo', 'Regras de Ottawa não se aplicam', ['Há um fator de exclusão marcado. Avalie a necessidade de radiografia por julgamento clínico.']);
        return;
    }
    const tornozelo = zona.value !== 'pe' && ['t1', 't2', 't3'].some(id => $(id).checked);
    const pe = zona.value !== 'tornozelo' && ['p1', 'p2', 'p3'].some(id => $(id).checked);
    const series = [];
    if (tornozelo) series.push('tornozelo (AP, perfil e incidência de mortise)');
    if (pe) series.push('pé (AP, oblíqua e perfil)');
    if (series.length) {
        mostrar('vermelho', 'Radiografia indicada', ['Solicitar série radiográfica de: ' + series.join(' e ') + '.',
            'Imobilizar, orientar não apoiar e encaminhar conforme o resultado.']);
    } else {
        mostrar('verde', 'Radiografia não indicada pela regra', ['Nenhum critério positivo. A regra tem sensibilidade próxima de 100% para fraturas do tornozelo e do médio-pé, então fratura clinicamente importante é muito improvável.',
            'Tratar como entorse (repouso relativo, gelo, compressão, elevação, analgesia e retorno progressivo às atividades) e reavaliar em 5 a 7 dias se persistir dor ou incapacidade de apoiar.']);
    }
}`,
  refs: [
    'Stiell IG et al. JAMA 1994;271:827-32 e Ann Emerg Med 1992;21:384-90 (regras de Ottawa).',
    'Bachmann LM et al. BMJ 2003;326:417 (revisão sistemática: sensibilidade próxima de 100% e redução de radiografias em cerca de 30 a 40%).',
    'Validada em adultos; há adaptações para crianças a partir de 5 anos, que exigem cuidado adicional.',
    'Não substitui o exame físico completo (palpação da fíbula proximal, sinais de lesão ligamentar, vascular e neurológica).'
  ]
});

// ======================= Glasgow (GCS) e GCS-Pupilas (GCS-P) =======================
const gcsOps = (nome, rotulo, ops, ajuda) => radio(nome, rotulo, ops.concat([['Não testável (ex.: olho fechado por edema, intubado, sedado)', 'nt']]), ajuda);
pagina({
  arquivo: 'calculadora-glasgow.html',
  titulo: 'Escala de Coma de Glasgow (GCS-P)',
  sub: 'Nível de consciência com resposta pupilar: Glasgow (3 a 15) e GCS-Pupilas (1 a 15)',
  hue: 'violet',
  corpo: [
    nota('Pontue a <strong>melhor resposta</strong> observada. Use estímulo sonoro (voz) antes do estímulo doloroso; para a dor, use pressão no leito ungueal, na região supraorbitária ou no trapézio.'),
    gcsOps('olho', 'Abertura ocular (O)', [['Espontânea (4)', 4], ['Ao estímulo sonoro (3)', 3], ['À pressão/dor (2)', 2], ['Nenhuma (1)', 1]]),
    gcsOps('verbal', 'Melhor resposta verbal (V)', [['Orientado (5)', 5], ['Confuso (4)', 4], ['Palavras inapropriadas (3)', 3], ['Sons incompreensíveis (2)', 2], ['Nenhuma (1)', 1]]),
    gcsOps('motor', 'Melhor resposta motora (M)', [['Obedece comandos (6)', 6], ['Localiza a dor (5)', 5], ['Flexão normal, retirada (4)', 4], ['Flexão anormal, decorticação (3)', 3], ['Extensão, descerebração (2)', 2], ['Nenhuma (1)', 1]]),
    '        <p class="font-semibold text-gray-800 pt-2">Resposta pupilar à luz</p>',
    radio('pupd', 'Pupila direita', [['Reage à luz', 'reage'], ['Não reage à luz', 'nao'], ['Não avaliável (ex.: trauma ocular, prótese, cirurgia prévia)', 'na']], 'Considere sem reação quando não há resposta à luz intensa e direta (alteração menor que 1 mm).'),
    radio('pupe', 'Pupila esquerda', [['Reage à luz', 'reage'], ['Não reage à luz', 'nao'], ['Não avaliável (ex.: trauma ocular, prótese, cirurgia prévia)', 'na']])
  ].join('\n'),
  script: `
function lerGcs(nome) {
    const el = document.querySelector('input[name="' + nome + '"]:checked');
    return el ? el.value : null;
}
function atualizar() {
    const o = lerGcs('olho'), v = lerGcs('verbal'), m = lerGcs('motor'), pd = lerGcs('pupd'), pe = lerGcs('pupe');
    if (o === null || v === null || m === null) { aviso('Selecione a abertura ocular, a resposta verbal e a resposta motora.'); return; }
    const letra = (l, x) => x === 'nt' ? l + 'NT' : l + x;
    const componentes = letra('O', o) + ' ' + letra('V', v) + ' ' + letra('M', m);
    if ([o, v, m].includes('nt')) {
        mostrar('cinza', 'Glasgow: ' + componentes, ['Há componente não testável: o total não é calculado, pois somar apenas os itens testáveis subestima a pontuação. Registre os componentes (por exemplo, O1 VNT M4) e use outros dados clínicos.']);
        return;
    }
    const gcs = Number(o) + Number(v) + Number(m);
    let cor, grau;
    if (gcs <= 8) { cor = 'vermelho'; grau = 'grave (3 a 8)'; }
    else if (gcs <= 12) { cor = 'laranja'; grau = 'moderado (9 a 12)'; }
    else if (gcs <= 14) { cor = 'amarelo'; grau = 'leve (13 e 14)'; }
    else { cor = 'verde'; grau = 'leve (15)'; }
    const linhas = ['Componentes: ' + componentes + '. Classificação clássica do rebaixamento (usada no traumatismo cranioencefálico): ' + grau + '.'];
    const extras = [];
    if (gcs <= 8) extras.push('Glasgow igual ou abaixo de 8 é o limiar clássico para considerar via aérea definitiva e atendimento de emergência/neurocirurgia; a decisão é clínica.');
    if (pd === null || pe === null) {
        linhas.push('Informe a resposta de cada pupila à luz para calcular o GCS-Pupilas (GCS-P).');
        mostrar(cor, 'Glasgow ' + gcs + '/15', linhas, extras);
        return;
    }
    if (pd === 'na' || pe === 'na') {
        linhas.push('Pupila não avaliável: o GCS-P não é calculado. Registre o Glasgow isolado e a pupila avaliável.');
        mostrar(cor, 'Glasgow ' + gcs + '/15', linhas, extras);
        return;
    }
    const prs = (pd === 'nao' ? 1 : 0) + (pe === 'nao' ? 1 : 0);
    const gcsp = gcs - prs;
    linhas.push('Reatividade pupilar: ' + (prs === 0 ? 'as duas pupilas reagem (escore pupilar 0)' : prs === 1 ? 'uma pupila não reage (escore pupilar 1)' : 'nenhuma pupila reage (escore pupilar 2)') + '.');
    linhas.push('GCS-P = Glasgow (' + gcs + ') − escore pupilar (' + prs + ') = ' + gcsp + ' (variação de 1 a 15). Quanto menor, pior o prognóstico; o GCS-P descreve melhor a gravidade do que o Glasgow isolado em lesão cerebral aguda.');
    if (prs > 0) extras.push('Pupila(s) sem reação à luz: avalie sinais de herniação ou lesão expansiva (e outras causas, como trauma ocular ou fármacos) e acione a emergência e a neurocirurgia sem atraso se houver suspeita de lesão intracraniana.');
    mostrar(cor, 'GCS-P ' + gcsp + '/15 (Glasgow ' + gcs + ')', linhas, extras);
}`,
  refs: [
    'Teasdale G, Jennett B. Assessment of coma and impaired consciousness. Lancet 1974;2:81-84 (escala original).',
    'Teasdale G et al. The Glasgow Coma Scale at 40 years: standing the test of time. Lancet Neurol 2014;13:844-854 (abordagem estruturada; componente não testável não entra na soma).',
    'Brennan PM, Murray GD, Teasdale GM. Simplifying the use of prognostic information in traumatic brain injury. Part 1: the GCS-Pupils score. J Neurosurg 2018 (GCS-P = Glasgow menos o número de pupilas sem reação, de 1 a 15).',
    'A classificação leve, moderada e grave por faixas de Glasgow é convenção usada no traumatismo cranioencefálico; outros contextos (intoxicação, sedação, AVC) exigem interpretação própria.',
    'Apoio à decisão: não substitui a avaliação neurológica completa nem protocolos de trauma (ATLS) e de via aérea.'
  ]
});

// ======================= Reposição de ferro endovenoso (Ganzoni) =======================
pagina({
  arquivo: 'calculadora-ferro-endovenoso.html',
  titulo: 'Reposição de ferro endovenoso',
  sub: 'Déficit total de ferro (fórmula de Ganzoni) e esquema por produto: sacarato de hidróxido férrico e carboximaltose férrica',
  hue: 'red',
  corpo: [
    nota('Antes de calcular, confirme a deficiência de ferro (ferritina, saturação de transferrina) e que a via oral foi insuficiente, não tolerada ou inadequada. Dose cumulativa e limites por aplicação seguem as bulas; confira sempre a bula vigente do produto disponível.'),
    num('peso', 'Peso (kg)', 'Peso atual, em kg. Abaixo de 35 kg, a bula usa hemoglobina-alvo e reservas diferentes (preenchidas automaticamente).', 'min="1" max="300" step="0.1"'),
    num('hb', 'Hemoglobina atual (g/dL)', '', 'min="1" max="20" step="0.1"'),
    num('alvo', 'Hemoglobina-alvo (g/dL)', 'Padrão da bula: 15 g/dL (35 kg ou mais) e 13 g/dL (abaixo de 35 kg). Pode ser ajustada conforme o protocolo do serviço.', 'min="5" max="20" step="0.1" value="15"'),
    num('reserva', 'Reservas de ferro (mg)', 'Padrão da bula: 500 mg (35 kg ou mais) e 15 mg/kg (abaixo de 35 kg).', 'min="0" max="2000" step="1" value="500"'),
    '        <p class="text-sm text-gray-600">Fórmula: déficit total de ferro (mg) = peso (kg) × (Hb-alvo − Hb atual, em g/dL) × 2,4 + reservas (mg).</p>'
  ].join('\n'),
  script: `
let editado = { alvo: false, reserva: false };
$('alvo').addEventListener('input', () => { editado.alvo = true; });
$('reserva').addEventListener('input', () => { editado.reserva = true; });
$('btn-limpar').addEventListener('click', () => { editado = { alvo: false, reserva: false }; });
const arred = x => Math.round(x);
function atualizar() {
    const peso = numero('peso'), hb = numero('hb');
    // padrões da bula conforme o peso, enquanto o usuário não alterou os campos
    if (peso !== null && peso > 0) {
        const kids = peso < 35;
        if (!editado.alvo) $('alvo').value = kids ? 13 : 15;
        if (!editado.reserva) $('reserva').value = kids ? Math.round(15 * peso) : 500;
    }
    const alvo = numero('alvo'), reserva = numero('reserva');
    if (peso === null || hb === null || alvo === null || reserva === null) { aviso('Informe peso e hemoglobina atual para calcular.'); return; }
    if (peso <= 0 || peso > 300 || hb <= 0 || hb > 20 || alvo <= 0 || reserva < 0) { aviso('Confira os valores informados.'); return; }
    if (alvo <= hb) { mostrar('cinza', 'Sem déficit pela fórmula', ['A hemoglobina atual já está igual ou acima da hemoglobina-alvo informada. Reavalie a indicação de ferro endovenoso (ferritina e saturação de transferrina).']); return; }
    const deficit = arred(peso * (alvo - hb) * 2.4 + reserva);
    const linhas = ['Déficit total de ferro (Ganzoni): ' + deficit + ' mg (peso ' + peso + ' kg × (' + alvo + ' − ' + hb + ') × 2,4 + reservas ' + reserva + ' mg).'];
    const extras = [];

    const f1 = x => x.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    const pl = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
    const kids = peso < 35;
    const plano = (total, max) => { // doses cheias + sobra; devolve [[dose, vezes], ...]
        const cheias = Math.floor(total / max), sobra = total - cheias * max, r = [];
        if (cheias > 0) r.push([max, cheias]);
        if (sobra > 0) r.push([sobra, 1]);
        return r;
    };

    // ---- Sacarato de hidróxido férrico (Noripurum EV): ampola de 5 mL = 100 mg (20 mg/mL); 1 mL em até 20 mL de SF 0,9% ----
    linhas.push('SACARATO DE HIDRÓXIDO FÉRRICO (Noripurum EV, ampola de 100 mg em 5 mL)');
    if (kids) {
        const porAplic = Math.floor(3 * peso);
        const n = Math.ceil(deficit / porAplic);
        linhas.push('• Total: ' + deficit + ' mg = ' + f1(deficit / 20) + ' mL = ' + f1(deficit / 100) + ' ampolas.');
        linhas.push('• Crianças: até 3 mg/kg por aplicação (cerca de ' + porAplic + ' mg = ' + f1(porAplic / 20) + ' mL, diluídos em até ' + f1(porAplic / 20 * 20) + ' mL de soro fisiológico 0,9%), no máximo 3 vezes por semana: pelo menos ' + n + ' aplicações.');
    } else {
        const ampTotal = Math.floor(deficit / 100);
        const ampMax = Math.max(1, Math.min(Math.floor(7 * peso / 100), 5)); // 7 mg/kg e teto de 500 mg por infusão
        linhas.push('• Total: ' + deficit + ' mg = ' + f1(deficit / 20) + ' mL = ' + f1(deficit / 100) + ' ampolas.');
        if (ampTotal === 0) {
            linhas.push('• O déficit é menor que 1 ampola (100 mg): ' + f1(deficit / 20) + ' mL em ' + f1(deficit / 20 * 20) + ' mL de soro fisiológico 0,9%.');
        } else {
            const usado = ampTotal * 100;
            linhas.push('• Com ampolas inteiras, sem ultrapassar o calculado: ' + ampTotal + ' ampolas (' + usado + ' mg). Sobra de ' + (deficit - usado) + ' mg; reavalie com Hb e ferritina ao fim do tratamento.');
            plano(ampTotal, ampMax).forEach(([amp, vezes]) => {
                linhas.push('• ' + pl(vezes, 'infusão', 'infusões') + ' de ' + pl(amp, 'ampola', 'ampolas') + ' (' + amp * 100 + ' mg = ' + amp * 5 + ' mL), ' + (vezes === 1 ? 'diluída' : 'cada uma diluída') + ' em ' + amp * 100 + ' mL de soro fisiológico 0,9%, 1 vez por semana.');
            });
            const nInf = Math.ceil(ampTotal / ampMax);
            linhas.push('• Máximo por infusão neste paciente: ' + pl(ampMax, 'ampola', 'ampolas') + ' (' + ampMax * 100 + ' mg), pelo limite de 7 mg/kg e 500 mg. Tratamento em ' + pl(nInf, 'semana', 'semanas') + '.');
            linhas.push('• Tempo mínimo: 100 mg (1 ampola) em 15 minutos; 500 mg (5 ampolas) em 3,5 horas; para as demais doses siga o quadro de tempos da bula.');
            const nInj = Math.ceil(ampTotal / 2);
            linhas.push('• Alternativa, injeção endovenosa lenta sem diluir: 1 a 2 ampolas (5 a 10 mL) por aplicação, em no mínimo 10 minutos (1 mL por minuto), 1 a 3 vezes por semana: cerca de ' + pl(nInj, 'aplicação', 'aplicações') + ' de 2 ampolas, em pelo menos ' + pl(Math.ceil(nInj / 3), 'semana', 'semanas') + '.');
        }
    }

    // ---- Carboximaltose férrica (Ferinject, 50 mg/mL): frascos de 2 mL (100 mg), 10 mL (500 mg) e 20 mL (1.000 mg) ----
    const sfFcm = mg => mg <= 200 ? [50, 3] : mg <= 500 ? [100, 6] : [250, 15]; // volume máximo de soro (mL) e tempo mínimo (min) da bula
    if (!kids) {
        const maxFcm = Math.floor(Math.min(1000, 20 * peso) / 50) * 50;
        linhas.push('CARBOXIMALTOSE FÉRRICA (Ferinject, 50 mg/mL; frascos de 100 mg em 2 mL, 500 mg em 10 mL e 1.000 mg em 20 mL)');
        linhas.push('• Total: ' + deficit + ' mg = ' + f1(deficit / 50) + ' mL.');
        let planoCm = plano(deficit, maxFcm), sobraCm = 0;
        const ultimo = planoCm[planoCm.length - 1];
        if (planoCm.length > 1 && ultimo[0] < 100) { sobraCm = ultimo[0]; planoCm.pop(); } // sobra pequena não justifica outra administração
        planoCm.forEach(([mg, vezes]) => {
            const [sf, min] = sfFcm(mg);
            linhas.push('• ' + pl(vezes, 'administração', 'administrações') + ' de ' + mg + ' mg (' + f1(mg / 50) + ' mL), ' + (vezes === 1 ? 'diluída' : 'cada uma diluída') + ' em até ' + sf + ' mL de soro fisiológico 0,9%, em no mínimo ' + min + ' minutos, 1 vez por semana.');
        });
        const nCm = planoCm.reduce((t, x) => t + x[1], 0);
        linhas.push('• Máximo por administração neste paciente: ' + maxFcm + ' mg (limite de 1.000 mg e 20 mg/kg). Tratamento em ' + pl(nCm, 'semana', 'semanas') + (sobraCm ? '; sobra de ' + sobraCm + ' mg não incluída, reavalie ao fim.' : '.') + ' Não dilua a menos de 2 mg de ferro por mL.');
        let simp;
        if (hb < 10) simp = peso >= 70 ? 2000 : 1500;
        else if (hb < 14) simp = peso >= 70 ? 1500 : 1000;
        else simp = 500;
        linhas.push('• Esquema simplificado da bula europeia/australiana (adultos de 35 kg ou mais): dose cumulativa de ' + simp + ' mg para Hb ' + (hb < 10 ? 'abaixo de 10' : hb < 14 ? 'de 10 a menos de 14' : 'de 14 ou mais') + ' g/dL e peso ' + (peso >= 70 ? 'de 70 kg ou mais' : 'de 35 a menos de 70 kg') + '. Não consta na página da bula brasileira consultada.');
    } else {
        linhas.push('CARBOXIMALTOSE FÉRRICA: a bula brasileira informa que não foi estudada em crianças.');
    }
    linhas.push('Nunca ultrapasse o déficit calculado; os volumes de soro são os da bula para cada dose. Confira a bula vigente do produto.');

    extras.push('Segurança: reações de hipersensibilidade graves, inclusive fatais, são possíveis com ferro endovenoso. Aplique onde haja suporte para ressuscitação, interrompa se houver reação e observe o paciente por pelo menos 30 minutos após a aplicação.');
    extras.push('Carboximaltose férrica: pode causar hipofosfatemia (osteomalácia e fraturas com doses altas repetidas e fatores de risco); considere dosar fósforo. Contraindicada em anemia não ferropriva e sobrecarga de ferro; cautela em infecção ativa e doença hepática.');
    mostrar(deficit > 0 ? 'azul' : 'cinza', 'Déficit de ferro: ' + deficit + ' mg', linhas, extras);
}`,
  refs: [
    'Ganzoni AM. Intravenous iron-dextran: therapeutic and experimental possibilities. Schweiz Med Wochenschr 1970;100:301-3 (fórmula de Ganzoni).',
    'Bula profissional do Noripurum EV (sacarato de hidróxido férrico): fórmula do déficit, hemoglobina-alvo de 15 g/dL (35 kg ou mais) e 13 g/dL (abaixo de 35 kg), reservas de 500 mg ou 15 mg/kg, limites de injeção (200 mg) e infusão (7 mg/kg, máximo de 500 mg por semana).',
    'Bula brasileira do Ferinject (carboximaltose férrica): dose única máxima de 1.000 mg por semana, advertências de hipersensibilidade e hipofosfatemia; bulas neozelandesa/australiana (Ferinject, Ferrive) para o limite de 20 mg/kg, a tabela simplificada por Hb e peso e o plano de diluição (volume máximo de soro e tempo mínimo por dose). Noripurum EV: ampola de 100 mg/5 mL, 1 mL em até 20 mL de soro fisiológico.',
    'Dados conferidos em páginas de bulas e guias institucionais; as doses podem diferir entre apresentações e países. Esta ferramenta é apoio ao cálculo e não substitui a prescrição médica nem a bula vigente.',
    'Não considera necessidades específicas: gestação, insuficiência cardíaca, doença renal crônica em diálise, infecção ativa e obesidade importante exigem protocolo próprio.'
  ]
});
