// Consulta de segurança de medicamentos na gestação/lactação.
// O prompt fica no servidor: esta rota só aceita o nome de um medicamento,
// então não serve como proxy genérico para a API do Gemini.
const { gerarConteudo } = require("../lib/ia");

exports.handler = async function(event) {
  const json = (statusCode, obj) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });

  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  let medicationName = "";
  try {
    medicationName = String(JSON.parse(event.body || "{}").medicationName || "").trim();
  } catch (e) {
    return json(400, { error: "Requisição inválida." });
  }
  if (!medicationName || medicationName.length > 80 || /[\r\n"`{}<>]/.test(medicationName)) {
    return json(400, { error: "Nome de medicamento inválido." });
  }

  const prompt = `
Você é um médico farmacologista. Analise a segurança do medicamento "${medicationName}" para gestantes e lactantes, em português do Brasil.
Não use a classificação por letras da FDA. Descreva o risco em texto.
Retorne EXATAMENTE UM objeto JSON válido (sem crases nem marcações de bloco, apenas o JSON puro):
{
  "isValid": true se o nome for um medicamento válido, false caso contrário,
  "gestacaoNivel": "compativel", "cautela", "evitar" ou "contraindicado",
  "gestacaoTexto": "Resumo clínico direto sobre o risco na gestação, citando trimestres quando relevante.",
  "lactacaoNivel": "compativel", "cautela", "evitar" ou "contraindicado",
  "lactacaoTexto": "Passagem para o leite materno e risco para o lactente.",
  "conduta": "Conduta sugerida e alternativas mais seguras na mesma classe terapêutica."
}`;

  // Gemini (modelo com plano gratuito) e, se falhar, Groq como reserva (ver netlify/lib/ia.js)
  const r = await gerarConteudo({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
  });
  if (!r.ok) return json(200, { error: "Nenhuma IA disponível no momento.", details: { error: { message: r.motivos.join(' | ') } } });
  return json(200, r.dados);
};
