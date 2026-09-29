// Gera data/medicamentos.json a partir de scripts/medicamentos-fonte.txt
// (nome|sinônimos|classe|nível gestação|texto|nível lactação|texto|conduta|fontes gestação|fontes lactação).
// Uso: node scripts/gerar-base-medicamentos.js
const fs = require('fs');
const NIVEIS = { c: 'compativel', a: 'cautela', e: 'evitar', x: 'contraindicado' };
const lista = s => (s === '-' ? [] : s.split(';').map(x => x.trim()).filter(Boolean));
const linhas = fs.readFileSync(__dirname + '/medicamentos-fonte.txt', 'utf8')
  .split('\n').filter(l => l.trim() && !l.startsWith('#'));
const medicamentos = linhas.map((l, i) => {
  const p = l.split('|');
  if (p.length === 8) p.push('-', '-'); // linhas ainda sem fontes conferidas
  if (p.length !== 10) throw new Error(`Linha ${i + 1} com ${p.length} campos: ${l.slice(0, 40)}`);
  const [nome, sin, classe, ng, tg, nl, tl, conduta, fg, fl] = p.map(s => s.trim());
  if (!NIVEIS[ng] || !NIVEIS[nl]) throw new Error(`Nível inválido: ${nome}`);
  return {
    nome, sinonimos: sin.split(';').map(s => s.trim()).filter(s => s && s.toLowerCase() !== nome.toLowerCase()),
    classe,
    gestacao: { nivel: NIVEIS[ng], texto: tg, fontes: lista(fg) },
    lactacao: { nivel: NIVEIS[nl], texto: tl, fontes: lista(fl) },
    conduta: conduta === '-' ? '' : conduta,
  };
});
medicamentos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
fs.writeFileSync(__dirname + '/../data/medicamentos.json', JSON.stringify({
  aviso: 'Conteúdo compilado com apoio de IA e conferido em 29/09/2026, quando havia dado, no LactMed e no MotherToBaby (via PubChem/NCBI) e nos manuais do Ministério da Saúde. Não passou por validação de comissão médica/farmacêutica, e o Briggs não foi consultado. Onde não há fonte indicada, o item não foi conferido. Confirme em bula e protocolos antes de decidir.',
  versao: 'v2 (conferência parcial em fontes, 29/09/2026)',
  niveis: { compativel: 'Compatível', cautela: 'Usar com cautela', evitar: 'Evitar', contraindicado: 'Contraindicado' },
  medicamentos,
}, null, 1));
console.log(`${medicamentos.length} medicamentos gravados.`);
