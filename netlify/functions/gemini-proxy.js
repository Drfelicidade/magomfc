const { gerarConteudo } = require("../lib/ia");

// Valida o ID token do Firebase sem dependências extras (API REST do Identity Toolkit)
async function tokenValido(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  if (!header.startsWith("Bearer ")) return false;
  const firebaseKey = (process.env.FIREBASE_API_KEY || "").trim();
  if (!firebaseKey) return false;
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: header.slice(7) })
    });
    if (!r.ok) return false;
    const data = await r.json();
    return Array.isArray(data.users) && data.users.length > 0;
  } catch (e) {
    return false;
  }
}

exports.handler = async function(event, context) {
  // Apenas aceita pedidos POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Exige usuário autenticado (token do Firebase)
  if (!(await tokenValido(event))) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Não autenticado. Faça login para usar este recurso." })
    };
  }

  // Limita o tamanho do corpo para reduzir abuso da cota da API
  if ((event.body || "").length > 20 * 1024 * 1024) {
    return { statusCode: 413, body: "Payload Too Large" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: "Requisição inválida." }) };
  }

  // Gemini (modelo com plano gratuito) e, se falhar, Groq como reserva (ver netlify/lib/ia.js)
  const r = await gerarConteudo(payload);
  if (!r.ok) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Nenhuma IA disponível no momento.", details: { error: { message: r.motivos.join(' | ') } } })
    };
  }
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r.dados) };
};
