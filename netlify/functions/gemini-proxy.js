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
    const payload = JSON.parse(event.body);
    
    // CORREÇÃO: Usar o modelo público estável (gemini-1.5-flash)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Se o Google der erro (como chave inválida ou erro na conta), 
    // devolvemos o erro detalhado para o frontend em vez de um 404 cego.
    if (!response.ok) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Erro na API do Google", details: data })
      };
    }

    return {
      statusCode: 200,
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
