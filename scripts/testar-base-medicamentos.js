// Valida o esquema da base local e mede o desempenho da busca com uma base grande simulada.
// Uso: node scripts/testar-base-medicamentos.js [tamanho_simulado]
const fs = require('fs');
const assert = require('assert');
const { indexar, buscar, norm } = require('../assets/busca-medicamentos.js');

const base = JSON.parse(fs.readFileSync(__dirname + '/../data/medicamentos.json', 'utf8'));
const cats = ['A', 'B', 'C', 'D', 'X', 'Não classificado'];
const lacts = ['Seguro', 'Risco Muito Baixo', 'Risco Moderado', 'Contraindicado'];
const nomes = new Set();
for (const m of base.medicamentos) {
  assert(m.nome && m.classe, `campos obrigatórios: ${m.nome}`);
  assert(cats.includes(m.gestacao.categoria), `categoria inválida: ${m.nome}`);
  assert(lacts.includes(m.lactacao.status), `status de lactação inválido: ${m.nome}`);
  assert(!nomes.has(norm(m.nome)), `duplicado: ${m.nome}`);
  nomes.add(norm(m.nome));
}
console.log(`Esquema OK: ${base.medicamentos.length} medicamentos.`);

const idx = indexar(base.medicamentos);
const casos = [
  ['paracetamol', 'Paracetamol'], ['PARACETAMOL', 'Paracetamol'], ['tylenol', 'Paracetamol'],
  ['isotretinoina', 'Isotretinoína'], ['metformna', 'Metformina'], ['acido folico', 'Ácido fólico'],
];
for (const [q, esperado] of casos) {
  const r = buscar(idx, q);
  const achou = (r.exato || r.sugestoes[0] || {}).nome;
  assert.strictEqual(achou, esperado, `busca "${q}" -> ${achou}`);
}
assert.strictEqual(buscar(idx, 'xyzabc').sugestoes.length, 0);
console.log('Casos de busca OK (acento, caixa, nome comercial, erro de digitação).');

// Benchmark: base simulada (padrão 5000 itens)
const n = Number(process.argv[2]) || 5000;
const sim = Array.from({ length: n }, (_, i) => ({
  nome: 'Medicamento' + i.toString(36) + 'xil', sinonimos: ['Marca' + i, 'Generico' + i],
  classe: 'x', gestacao: { categoria: 'C', texto: 'x'.repeat(200) }, lactacao: { status: 'Seguro', texto: 'x'.repeat(200) },
  alternativas: 'x'.repeat(100),
}));
const bytes = Buffer.byteLength(JSON.stringify(sim));
const t0 = process.hrtime.bigint();
const idxSim = indexar(sim);
const t1 = process.hrtime.bigint();
const consultas = ['medicamento1', 'marca42', 'generco99', 'zzzz', 'medicamentoab'];
for (let r = 0; r < 20; r++) for (const q of consultas) buscar(idxSim, q);
const t2 = process.hrtime.bigint();
console.log(`Base simulada: ${n} itens, ${(bytes / 1024).toFixed(0)} KB (JSON, sem compressão).`);
console.log(`Indexação: ${Number(t1 - t0) / 1e6} ms | busca média: ${(Number(t2 - t1) / 1e6 / (20 * consultas.length)).toFixed(2)} ms`);
