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

  // Vai buscar a chave configurada na Netlify e limpa espaços vazios
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    return { 
      statusCode: 200, 
      body: JSON.stringify({ error: "Chave de API não configurada no servidor da Netlify." }) 
    };
  }

  // Limita o tamanho do corpo para reduzir abuso da cota da API
  if ((event.body || "").length > 20 * 1024 * 1024) {
    return { statusCode: 413, body: "Payload Too Large" };
  }

  try {
    const payload = JSON.parse(event.body);
    
    // CORREÇÃO FINAL: Adicionado o sufixo "-latest" ao modelo
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Se o Google der erro, devolvemos com status 200 para o site ler o motivo
    if (!response.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Erro na API do Google:", details: data })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return { 
      statusCode: 200, 
      body: JSON.stringify({ error: "Erro interno no servidor (Proxy)", details: error.message }) 
    };
  }
};
