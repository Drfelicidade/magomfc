// netlify/functions/gemini-proxy.js

exports.handler = async function(event, context) {
  // Apenas aceita pedidos POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Vai buscar a chave configurada no painel da Netlify
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Chave de API não configurada no servidor da Netlify." }) 
    };
  }

  try {
    // Lê o payload enviado pelo site
    const payload = JSON.parse(event.body);
    
    // URL oficial da API do Gemini (usando o modelo especificado)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    // Faz o pedido seguro ao Google
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Retorna a resposta ao nosso site
    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Erro interno no servidor (Proxy)", details: error.message }) 
    };
  }
};
