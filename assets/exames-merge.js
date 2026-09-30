// Junta as leituras da IA (vários lotes de páginas) em uma linha por data.
// Entrada: [{ data: "dd/mm/aaaa", itens: [{ nome, valor }] }, ...] na ordem em que foram lidas.
// Saída de formatar(): "(dd/mm/aaaa) Exame - valor / Exame - valor" (uma linha por data).
(function (root) {
    const SEM_DATA = 'Data não identificada';

    const semAcento = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/\s+/g, ' ').trim();
    const URINA = /^(?:parcial de urina|urina tipo i|urina rotina|urina|eas)\s*[-–:]\s*(.+)$/i;
    const CHAVE_URINA = '#urina';
    // Nomes em CAIXA ALTA viram "Primeira letra maiúscula"; siglas (TSH, HDL, VCM, B12...) continuam em maiúsculas.
    // Nomes que já vêm em caixa mista (ex.: "Colesterol Total") não são alterados.
    const LIGACOES = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'com', 'para', 'por', 'a', 'o', 'sem', 'ao', 'no', 'na', 'nos', 'nas', 'ou', 'pelo', 'pela'];
    const SIGLAS_LONGAS = ['CHCM', 'VLDL', 'HBA1C', 'HBSAG', 'TTPA', 'NTPROBNP', 'HOMAIR', 'ANTIHCV', 'ANTIHIV', 'FSH', 'PTH'];
    function ajustarCaixa(nome) {
        const letras = nome.replace(/[^A-Za-zÀ-ÿ]/g, '');
        if (!letras || letras !== letras.toUpperCase()) return nome;
        let primeiro = true;
        return nome.split(/(\s+)/).map(w => {
            if (!w.trim()) return w;
            const limpa = w.replace(/[^A-Za-zÀ-ÿ0-9]/g, '');
            const sigla = /\d/.test(limpa) || limpa.length <= 3 || SIGLAS_LONGAS.indexOf(limpa) >= 0;
            const ligacao = LIGACOES.indexOf(limpa.toLowerCase()) >= 0 && !primeiro;
            let out;
            if (ligacao) out = w.toLowerCase();
            else if (sigla) out = w;
            else out = primeiro ? w.charAt(0) + w.slice(1).toLowerCase() : w.toLowerCase();
            primeiro = false;
            return out;
        }).join('');
    }

    const pad = n => String(n).padStart(2, '0');

    // Aceita dd/mm/aaaa, dd/mm/aa, dd-mm-aaaa, dd.mm.aaaa e aaaa-mm-dd; devolve dd/mm/aaaa ou null.
    function normalizarData(d) {
        if (d == null) return null;
        const s = String(d).trim();
        let m, dia, mes, ano;
        if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/))) { dia = +m[1]; mes = +m[2]; ano = m[3]; }
        else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) { ano = m[1]; mes = +m[2]; dia = +m[3]; }
        else return null;
        ano = ano.length === 2 ? (+ano <= 69 ? 2000 : 1900) + (+ano) : +ano;
        const t = new Date(ano, mes - 1, dia);
        if (ano < 1900 || ano > 2100 || t.getFullYear() !== ano || t.getMonth() !== mes - 1 || t.getDate() !== dia) return null;
        return pad(dia) + '/' + pad(mes) + '/' + ano;
    }

    const chaveData = d => { const [dd, mm, aa] = d.split('/'); return +aa * 10000 + +mm * 100 + +dd; };

    // Ordem do perfil lipídico: Colesterol Total, HDL, LDL, Triglicerídeos.
    function ordemLipidica(nome) {
        const n = semAcento(nome);
        if (n === 'colesterol total' || n === 'colesterol' || n === 'ct') return 0;
        if (/^(colesterol )?hdl/.test(n)) return 1;
        if (/^(colesterol )?ldl/.test(n)) return 2;
        if (/^triglic/.test(n)) return 3;
        return -1;
    }

    function agruparLipidios(itens) {
        const idx = itens.map((it, i) => ordemLipidica(it.nome) >= 0 ? i : -1).filter(i => i >= 0);
        if (idx.length < 2) return itens;
        const bloco = idx.map(i => itens[i]).sort((a, b) => ordemLipidica(a.nome) - ordemLipidica(b.nome));
        const resto = itens.filter((_, i) => idx.indexOf(i) < 0);
        resto.splice(idx[0], 0, ...bloco); // posição do primeiro item lipídico
        return resto;
    }

    // Junta todas as leituras: uma entrada por data; itens repetidos (mesmo exame e mesmo valor) saem uma vez;
    // o mesmo exame com valores diferentes na mesma data mantém os dois valores.
    function mesclar(exames) {
        const grupos = new Map();
        (exames || []).forEach(e => {
            const data = normalizarData(e && e.data) || SEM_DATA;
            if (!grupos.has(data)) grupos.set(data, []);
            const lista = grupos.get(data);
            ((e && e.itens) || []).forEach(it => {
                const nomeBruto = String((it && it.nome) || '').trim();
                let nome = ajustarCaixa(nomeBruto);
                if (!nome) return;
                let valor = String((it && it.valor) == null ? '' : it.valor).trim();
                // Alterações da urina lidas como itens soltos ("Urina - Leucócitos 12*") viram um único item "Parcial de Urina"
                const u = nomeBruto.match(URINA) || (valor && semAcento(nomeBruto) === 'parcial de urina' ? [nome, valor] : null);
                if (u) {
                    const sub = ajustarCaixa(u[1].trim());
                    const parte = u[1] === valor && !URINA.test(nomeBruto) ? valor : (valor ? sub + ' ' + valor : sub);
                    let agg = lista.find(x => x.chave === CHAVE_URINA);
                    if (!agg) { agg = { nome: 'Parcial de Urina', valor: '', chave: CHAVE_URINA, partes: [] }; lista.push(agg); }
                    if (agg.partes.indexOf(parte) < 0) { agg.partes.push(parte); agg.valor = agg.partes.join(', '); }
                    return;
                }
                const chave = semAcento(nome) + '|' + semAcento(valor.replace(/\*/g, ''));
                const existente = lista.find(x => x.chave === chave);
                if (existente) { if (valor.indexOf('*') >= 0 && existente.valor.indexOf('*') < 0) existente.valor = valor; return; }
                lista.push({ nome, valor, chave });
            });
        });
        grupos.forEach((lista, data) => grupos.set(data, agruparLipidios(lista)));
        return grupos;
    }

    // ordem: 'asc' (mais antiga primeiro) ou 'desc' (mais recente primeiro); datas não identificadas ficam por último.
    function formatar(grupos, ordem) {
        const datas = Array.from(grupos.keys()).filter(d => d !== SEM_DATA && grupos.get(d).length);
        datas.sort((a, b) => ordem === 'desc' ? chaveData(b) - chaveData(a) : chaveData(a) - chaveData(b));
        if (grupos.has(SEM_DATA) && grupos.get(SEM_DATA).length) datas.push(SEM_DATA);
        return datas.map(d => '(' + d + ') ' + grupos.get(d).map(it => it.valor ? it.nome + ' - ' + it.valor : it.nome).join(' / ')).join('\n');
    }

    const api = { SEM_DATA, normalizarData, ajustarCaixa, mesclar, formatar };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.ExamesMerge = api;
})(typeof window !== 'undefined' ? window : globalThis);
