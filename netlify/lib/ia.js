// Chamada de IA com reserva: tenta o Gemini (modelo com plano gratuito) e, se falhar, usa o Groq.
// Variáveis na Netlify: GEMINI_API_KEY (obrigatória), GROQ_API_KEY (opcional, ativa a reserva),
// GEMINI_MODEL e GROQ_MODEL (opcionais, para trocar de modelo sem mexer no código).
// Recebe e devolve o formato da API do Gemini, então as páginas não precisam saber qual IA respondeu.

const modeloGemini = () => (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
const modeloGroq = () => (process.env.GROQ_MODEL || 'qwen/qwen3.8-27b').trim();

async function lerJson(resp) {
  const bruto = await resp.text();
  try { return JSON.parse(bruto); } catch (e) { return { erroBruto: bruto.slice(0, 300) }; }
}

async function chamarGemini(payload) {
  const chave = (process.env.GEMINI_API_KEY || '').trim();
  if (!chave) return { ok: false, motivo: 'GEMINI_API_KEY não configurada.' };
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modeloGemini())}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
      body: JSON.stringify(payload)
    });
    const dados = await lerJson(resp);
    const texto = textoGemini(dados);
    if (!resp.ok || !texto) {
      const msg = (dados.error && dados.error.message) || dados.erroBruto || 'resposta vazia';
      return { ok: false, status: resp.status, motivo: `Gemini (${resp.status}): ${msg}` };
    }
    return { ok: true, dados };
  } catch (e) {
    return { ok: false, motivo: 'Gemini: ' + e.message };
  }
}

function textoGemini(dados) {
  const c = dados && dados.candidates && dados.candidates[0];
  return c && c.content && c.content.parts ? c.content.parts.map(p => p.text || '').join('') : '';
}

// Converte o pedido no formato do Gemini (texto + imagens em base64) para o formato do Groq (compatível com OpenAI).
function paraGroq(payload, instrucaoJson) {
  const conteudo = [];
  ((payload.contents && payload.contents[0] && payload.contents[0].parts) || []).forEach(p => {
    if (p.text) conteudo.push({ type: 'text', text: p.text });
    else if (p.inlineData) conteudo.push({ type: 'image_url', image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` } });
  });
  const cfg = payload.generationConfig || {};
  // o Groq não aplica o responseSchema do Gemini: o esquema vai por escrito no pedido
  if (cfg.responseSchema) conteudo.push({ type: 'text', text: 'Responda somente com um objeto JSON válido, sem texto antes ou depois, seguindo este esquema (tipos do Gemini): ' + JSON.stringify(cfg.responseSchema) });
  else if (cfg.responseMimeType === 'application/json') conteudo.push({ type: 'text', text: 'Responda somente com um objeto JSON válido, sem texto antes ou depois.' });
  if (instrucaoJson) conteudo.push({ type: 'text', text: instrucaoJson });
  const corpo = {
    model: modeloGroq(),
    messages: [{ role: 'user', content: conteudo }],
    temperature: typeof cfg.temperature === 'number' ? cfg.temperature : 0
  };
  if (cfg.responseMimeType === 'application/json') corpo.response_format = { type: 'json_object' };
  return corpo;
}

// Remove raciocínio (<think>) e cercas de código; devolve só o objeto JSON quando o pedido é JSON.
function limparTexto(texto, json) {
  let t = String(texto || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  if (json) { const i = t.indexOf('{'), f = t.lastIndexOf('}'); if (i >= 0 && f > i) t = t.slice(i, f + 1); }
  return t;
}

async function chamarGroq(payload, instrucaoJson) {
  const chave = (process.env.GROQ_API_KEY || '').trim();
  if (!chave) return { ok: false, motivo: 'GROQ_API_KEY não configurada (reserva desativada).' };
  try {
    const corpo = paraGroq(payload, instrucaoJson);
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${chave}` },
      body: JSON.stringify(corpo)
    });
    const dados = await lerJson(resp);
    const bruto = dados.choices && dados.choices[0] && dados.choices[0].message && dados.choices[0].message.content;
    if (!resp.ok || !bruto) {
      const msg = (dados.error && dados.error.message) || dados.erroBruto || 'resposta vazia';
      return { ok: false, status: resp.status, motivo: `Groq (${resp.status}): ${msg}` };
    }
    const texto = limparTexto(bruto, !!corpo.response_format);
    // devolve no formato do Gemini, para as páginas lerem igual
    return { ok: true, dados: { candidates: [{ content: { parts: [{ text: texto }] } }] } };
  } catch (e) {
    return { ok: false, motivo: 'Groq: ' + e.message };
  }
}

// Tenta Gemini e, se falhar por qualquer motivo (cota, cobrança, erro do servidor, resposta vazia), o Groq.
async function gerarConteudo(payload, opcoes) {
  const g = await chamarGemini(payload);
  if (g.ok) return { ok: true, dados: Object.assign({}, g.dados, { provedor: 'gemini' }) };
  const q = await chamarGroq(payload, opcoes && opcoes.instrucaoJson);
  if (q.ok) return { ok: true, dados: Object.assign({}, q.dados, { provedor: 'groq', avisoGemini: g.motivo }) };
  return { ok: false, motivos: [g.motivo, q.motivo] };
}

module.exports = { gerarConteudo, paraGroq, limparTexto, modeloGemini, modeloGroq };
