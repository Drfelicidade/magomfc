// Consulta de segurança de medicamentos na gestação/lactação.
// O prompt fica no servidor: esta rota só aceita o nome de um medicamento,
// então não serve como proxy genérico para a API do Gemini.
exports.handler = async function(event) {
  const json = (statusCode, obj) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  });

  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return json(200, { error: "Chave de API não configurada no servidor da Netlify." });

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
Você é um médico farmacologista. Analise a segurança do medicamento "${medicationName}" para gestantes e lactantes.
Retorne EXATAMENTE UM objeto JSON válido com os seguintes campos (não use crases \`\`\` nem marcações de bloco, apenas o JSON puro):
{
  "isValid": true se o nome for um medicamento válido, false caso contrário,
  "fdaCategory": "A letra da categoria FDA (A, B, C, D ou X) ou 'Não classificado'",
  "gestationRiskText": "Resumo clínico sobre o risco fetal na gestação. Seja direto.",
  "lactationStatus": "Classifique como 'Seguro', 'Risco Muito Baixo', 'Risco Moderado' ou 'Contraindicado'",
  "lactationRiskText": "Explique a passagem para o leite materno e o risco para o bebê.",
  "alternatives": "Sugira a conduta e alternativas mais seguras na mesma classe terapêutica."
}`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) return json(200, { error: "Erro na API do Google:", details: data });
    return json(200, data);
  } catch (error) {
    return json(200, { error: "Erro interno no servidor", details: error.message });
  }
};
