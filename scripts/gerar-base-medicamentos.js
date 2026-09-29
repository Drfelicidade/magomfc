// Gera data/medicamentos.json a partir de scripts/medicamentos-fonte.txt
// (nome|sinônimos|classe|nível gestação|texto|nível lactação|texto|conduta).
// Uso: node scripts/gerar-base-medicamentos.js
const fs = require('fs');
const NIVEIS = { c: 'compativel', a: 'cautela', e: 'evitar', x: 'contraindicado' };
const linhas = fs.readFileSync(__dirname + '/medicamentos-fonte.txt', 'utf8')
  .split('\n').filter(l => l.trim() && !l.startsWith('#'));
const medicamentos = linhas.map((l, i) => {
  const p = l.split('|');
  if (p.length !== 8) throw new Error(`Linha ${i + 1} com ${p.length} campos: ${l.slice(0, 40)}`);
  const [nome, sin, classe, ng, tg, nl, tl, conduta] = p.map(s => s.trim());
  if (!NIVEIS[ng] || !NIVEIS[nl]) throw new Error(`Nível inválido: ${nome}`);
  return {
    nome, sinonimos: sin.split(';').map(s => s.trim()).filter(s => s && s.toLowerCase() !== nome.toLowerCase()),
    classe,
    gestacao: { nivel: NIVEIS[ng], texto: tg },
    lactacao: { nivel: NIVEIS[nl], texto: tl },
    conduta: conduta === '-' ? '' : conduta,
    revisao: 'revisao-assistida-ia',
  };
});
medicamentos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
fs.writeFileSync(__dirname + '/../data/medicamentos.json', JSON.stringify({
  aviso: 'Conteúdo compilado e revisado com apoio de IA, sem validação por comissão médica/farmacêutica e sem conferência automática em bases externas. Confirme em LactMed, Briggs, bulas e protocolos do Ministério da Saúde antes de decidir.',
  versao: 'v1 (revisão assistida por IA)',
  niveis: { compativel: 'Compatível', cautela: 'Usar com cautela', evitar: 'Evitar', contraindicado: 'Contraindicado' },
  medicamentos,
}, null, 1));
console.log(`${medicamentos.length} medicamentos gravados.`);
