// Busca local: normaliza acentos, casa por prefixo/substring e tolera erros de digitação.
(function (root) {
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  function distancia(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let menor = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < menor) menor = cur[j];
      }
      if (menor > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function indexar(medicamentos) {
    return medicamentos.map(m => ({ m, chaves: [m.nome, ...(m.sinonimos || [])].map(norm) }));
  }

  // Retorna { exato, sugestoes }. Sugestões: prefixo > substring > erro de digitação.
  function buscar(indice, consulta, limite) {
    const q = norm(consulta);
    limite = limite || 6;
    if (!q) return { exato: null, sugestoes: [] };
    const pontuados = [];
    for (const item of indice) {
      let melhor = Infinity;
      for (const k of item.chaves) {
        if (k === q) melhor = Math.min(melhor, 0);
        else if (k.startsWith(q)) melhor = Math.min(melhor, 1);
        else if (q.length >= 3 && k.includes(q)) melhor = Math.min(melhor, 2);
        else if (q.length >= 4) {
          const d = distancia(k, q, 2);
          if (d <= 2) melhor = Math.min(melhor, 2 + d);
        }
      }
      if (melhor !== Infinity) pontuados.push([melhor, item.m]);
    }
    pontuados.sort((a, b) => a[0] - b[0] || a[1].nome.localeCompare(b[1].nome));
    const exato = pontuados.length && pontuados[0][0] === 0 ? pontuados[0][1] : null;
    return { exato, sugestoes: pontuados.slice(0, limite).map(p => p[1]) };
  }

  const api = { norm, indexar, buscar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BuscaMedicamentos = api;
})(typeof window !== 'undefined' ? window : globalThis);
