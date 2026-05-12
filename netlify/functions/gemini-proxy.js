exports.handler = async function(event, context) {
  // Apenas aceita pedidos POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Vai buscar a chave configurada na Netlify e remove espaços em branco acidentais (causa do erro 400)
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    return { 
      statusCode: 200, 
      body: JSON.stringify({ error: "Chave de API não configurada no servidor da Netlify." }) 
    };
  }

  try {
    const payload = JSON.parse(event.body);
    
    // Usar o modelo público estável (gemini-1.5-flash)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Se o Google der erro, devolvemos com status 200 (para o frontend conseguir ler o motivo exato)
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
