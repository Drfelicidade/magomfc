// Chamada de IA com reserva: tenta o Gemini (modelo com plano gratuito) e, se falhar, usa o Groq.
// Variáveis na Netlify: GEMINI_API_KEY (obrigatória), GROQ_API_KEY (opcional, ativa a reserva),
// GEMINI_MODEL e GROQ_MODEL (opcionais, para trocar de modelo sem mexer no código).
// Recebe e devolve o formato da API do Gemini, então as páginas não precisam saber qual IA respondeu.

// Modelos do Gemini com plano gratuito, em ordem de preferência. GEMINI_MODEL força um só. Se um modelo estiver
// indisponível, sem cota ou sobrecarregado, a chamada passa ao próximo da lista antes de recorrer ao Groq.
const MODELOS_GEMINI = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const modelosGemini = () => process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL.trim()] : MODELOS_GEMINI;
const modeloGemini = () => modelosGemini()[0];
const modeloGroq = () => (process.env.GROQ_MODEL || 'qwen/qwen3.8-27b').trim();
// Tempo máximo (ms) de todas as tentativas no Gemini e do Groq: deixa folga para a reserva responder dentro do limite da função.
const tempoGemini = () => Number(process.env.GEMINI_TIMEOUT_MS) || 14000;
const tempoGroq = () => Number(process.env.GROQ_TIMEOUT_MS) || 10000;

async function lerJson(resp) {
  const bruto = await resp.text();
  try { return JSON.parse(bruto); } catch (e) { return { erroBruto: bruto.slice(0, 300) }; }
}

// 404 = modelo retirado; 429 = cota (é por modelo); 5xx = modelo sobrecarregado ("high demand"): outro modelo pode responder.
const TENTAR_OUTRO_MODELO = [404, 429, 500, 502, 503, 504];

// Pausa por modelo (na memória da função, enquanto ela está "quente"): um modelo que acabou de responder 429 (cota)
// ou 5xx (sobrecarga) é pulado por um tempo, para os pedidos seguintes não gastarem segundos nele e irem logo ao próximo.
const pausas = {};
const PAUSA_MS = { 429: 60000, 404: 600000, def: 20000 };
const tempoTentativa = () => Number(process.env.GEMINI_TENTATIVA_MS) || 8000; // teto de uma tentativa, para uma lenta não consumir todas

async function tentarGemini(modelo, payload, chave, ms) {
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(Math.max(ms, 1))
  });
  const dados = await lerJson(resp);
  const texto = textoGemini(dados);
  if (resp.ok && texto) return { ok: true, dados };
  const msg = (dados.error && dados.error.message) || dados.erroBruto || 'resposta vazia';
  return { ok: false, status: resp.status, motivo: `Gemini ${modelo} (${resp.status}): ${String(msg).split(' For more information')[0].slice(0, 220)}${detalhesErro(dados)}` };
}

// Em erros de cota o Google informa qual limite estourou (ex.: ..._free_tier_requests mostra que a chave ainda vale como gratuita)
// e quanto esperar. Isso entra na mensagem para facilitar o diagnóstico.
function detalhesErro(dados) {
  try {
    const itens = (dados.error && dados.error.details) || [];
    const partes = [];
    itens.forEach(d => {
      (d.violations || []).forEach(v => { if (v.quotaMetric) partes.push('limite: ' + String(v.quotaMetric).replace('generativelanguage.googleapis.com/', '') + (v.quotaId ? ' / ' + v.quotaId : '')); });
      if (d.retryDelay) partes.push('esperar ' + d.retryDelay);
    });
    return partes.length ? ' [' + partes.slice(0, 3).join('; ') + ']' : '';
  } catch (e) { return ''; }
}

async function chamarGemini(payload) {
  const chave = (process.env.GEMINI_API_KEY || '').trim();
  if (!chave) return { ok: false, motivo: 'GEMINI_API_KEY não configurada.' };
  const limite = Date.now() + tempoGemini();
  const motivos = [];
  try {
    for (const modelo of modelosGemini()) {
      const restante = limite - Date.now();
      if (restante <= 0) { motivos.push('Gemini: demorou mais de ' + tempoGemini() / 1000 + ' s'); break; }
      if ((pausas[modelo] || 0) > Date.now()) { motivos.push(`Gemini ${modelo}: em pausa por ${Math.ceil((pausas[modelo] - Date.now()) / 1000)} s (falhou há pouco)`); continue; }
      let r;
      try {
        r = await tentarGemini(modelo, semRaciocinio(payload, modelo), chave, Math.min(restante, tempoTentativa()));
        // se o modelo recusou o ajuste de raciocínio (400), repete sem ele
        if (!r.ok && r.status === 400 && semRaciocinio(payload, modelo) !== payload) r = await tentarGemini(modelo, payload, chave, Math.max(limite - Date.now(), 1000));
      } catch (e) {
        // uma tentativa lenta não encerra a busca: marca o modelo e segue para o próximo
        motivos.push(`Gemini ${modelo}: ` + (e.name === 'TimeoutError' ? 'sem resposta no tempo limite' : e.message));
        pausas[modelo] = Date.now() + PAUSA_MS.def;
        continue;
      }
      if (r.ok) return { ok: true, dados: r.dados, modelo };
      motivos.push(r.motivo);
      pausas[modelo] = Date.now() + (PAUSA_MS[r.status] || PAUSA_MS.def);
      if (TENTAR_OUTRO_MODELO.indexOf(r.status) < 0) break; // erro de pedido, chave ou cobrança (400, 401, 403) não melhora em outro modelo: vai para a reserva
    }
    return { ok: false, motivo: motivos.join(' | ') };
  } catch (e) {
    // tentativa lenta demais: pausa curta no modelo e segue para a reserva
    return { ok: false, motivo: motivos.concat('Gemini: ' + (e.name === 'TimeoutError' ? 'demorou mais de ' + tempoGemini() / 1000 + ' s' : e.message)).join(' | ') };
  }
}

// Extração de texto não precisa de "raciocínio", que deixa a resposta muito mais lenta:
// 2.5 Flash aceita thinkingBudget 0; os modelos 3.x aceitam thinkingLevel (o menor comum é "low"; os "lite" já vêm no mínimo).
function semRaciocinio(payload, modelo) {
  const cfg = payload.generationConfig || {};
  if (cfg.thinkingConfig) return payload;
  let pensar = null;
  if (/gemini-2\.5-flash/.test(modelo)) pensar = { thinkingBudget: 0 };
  else if (/gemini-3/.test(modelo) && !/lite/.test(modelo)) pensar = { thinkingLevel: 'low' };
  if (!pensar) return payload;
  return Object.assign({}, payload, { generationConfig: Object.assign({}, cfg, { thinkingConfig: pensar }) });
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
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(tempoGroq())
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
    return { ok: false, motivo: 'Groq: ' + (e.name === 'TimeoutError' ? 'demorou mais de ' + tempoGroq() / 1000 + ' s' : e.message) };
  }
}

// Tenta Gemini e, se falhar por qualquer motivo (cota, cobrança, erro do servidor, resposta vazia), o Groq.
async function gerarConteudo(payload, opcoes) {
  const g = await chamarGemini(payload);
  if (g.ok) return { ok: true, dados: Object.assign({}, g.dados, { provedor: 'gemini', modelo: g.modelo }) };
  const q = await chamarGroq(payload, opcoes && opcoes.instrucaoJson);
  if (q.ok) return { ok: true, dados: Object.assign({}, q.dados, { provedor: 'groq', avisoGemini: g.motivo }) };
  return { ok: false, motivos: [g.motivo, q.motivo] };
}

module.exports = { gerarConteudo, paraGroq, limparTexto, semRaciocinio, modeloGemini, modeloGroq };
