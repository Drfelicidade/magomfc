// Alternância manual entre modo claro e escuro. Sem escolha salva, segue o modo do navegador/sistema.
// Carregar de forma síncrona no <head>, logo depois do link de assets/tema-escuro.css (evita piscar o tema errado).
(function () {
    var CHAVE = 'mago-tema';
    var raiz = document.documentElement;
    var link = document.querySelector('link[href$="tema-escuro.css"]');
    var temaProprio = raiz.hasAttribute('data-tema-proprio'); // página com tema escuro próprio (variáveis CSS que reagem a [data-tema])
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var AUTO = 'screen and (prefers-color-scheme: dark)';

    function ler() {
        try { var v = localStorage.getItem(CHAVE); return v === 'claro' || v === 'escuro' ? v : ''; } catch (e) { return ''; }
    }
    function gravar(v) {
        try { if (v) localStorage.setItem(CHAVE, v); else localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento: vale só nesta página */ }
    }
    var modo = ler(); // '' = automático
    function sistemaEscuro() { return !!(mq && mq.matches); }
    function escuro() { return modo ? modo === 'escuro' : sistemaEscuro(); }

    function aplicar() {
        if (link) link.media = modo === 'escuro' ? 'screen' : modo === 'claro' ? 'not all' : AUTO;
        raiz.style.colorScheme = modo === 'claro' ? 'light' : modo === 'escuro' ? 'dark' : '';
        raiz.setAttribute('data-tema', modo || 'auto');
        atualizarBotao();
        window.dispatchEvent(new Event('mago-tema'));
    }
    function alternar() {
        var alvo = escuro() ? 'claro' : 'escuro';
        // voltar ao modo do sistema limpa a escolha: o padrão automático continua valendo
        modo = (alvo === 'escuro') === sistemaEscuro() ? '' : alvo;
        gravar(modo);
        aplicar();
    }
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (!modo) { atualizarBotao(); window.dispatchEvent(new Event('mago-tema')); } });
    window.addEventListener('storage', function (e) { if (e.key === CHAVE) { modo = ler(); aplicar(); } }); // outra aba mudou

    // ---------- Barra de ações no alto da página (alinhada à moldura central) ----------
    var ALTURA_TOPO = 32, caixa = null, botao = null;
    function moldura() {
        var lista = document.querySelectorAll('main, .container, [class*="max-w-"]'), melhor = null;
        for (var i = 0; i < lista.length; i++) {
            var e = lista[i];
            if (e.closest('#aviso-clinico, dialog, #topo-acoes')) continue;
            var r = e.getBoundingClientRect();
            if (r.width > 200 && r.height > 80 && r.top < 500 && r.right <= document.documentElement.clientWidth + 1 && (!melhor || r.width > melhor.width)) melhor = r;
        }
        return melhor;
    }
    function acoes() {
        if (caixa) return caixa;
        if (!document.body) return null;
        caixa = document.createElement('div');
        caixa.id = 'topo-acoes';
        caixa.style.cssText = 'position:absolute;top:4px;right:12px;z-index:40;display:flex;gap:6px;align-items:center';
        var p = document.createElement('style');
        p.textContent = '@media print{#topo-acoes{display:none !important}}';
        document.head.appendChild(p);
        document.body.appendChild(caixa);
        var base = null;
        function posicionar() {
            if (base === null) base = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
            if (base < ALTURA_TOPO) document.body.style.paddingTop = ALTURA_TOPO + 'px'; // espaço sem cobrir a moldura
            var r = moldura(), larg = document.documentElement.clientWidth;
            caixa.style.right = (r ? Math.max(8, larg - r.right) : 12) + 'px';
        }
        posicionar();
        window.addEventListener('resize', posicionar);
        window.addEventListener('load', posicionar);
        setTimeout(posicionar, 300); setTimeout(posicionar, 1200); // o Tailwind aplica as classes depois do carregamento
        if (window.MutationObserver) new MutationObserver(posicionar).observe(document.body, { attributes: true, attributeFilter: ['class', 'style'], subtree: true });
        return caixa;
    }
    function atualizarBotao() {
        if (!botao) return;
        var e = escuro();
        botao.textContent = e ? '☀️ Claro' : '🌙 Escuro';
        botao.setAttribute('aria-label', e ? 'Mudar para o modo claro' : 'Mudar para o modo escuro');
        botao.title = modo ? 'Tema escolhido por você. Alternar de volta ao modo do sistema restaura o automático.' : 'Seguindo o modo do seu navegador/sistema';
        botao.style.cssText = 'border:1px solid ' + (e ? '#4a5f6b' : '#cbd5e1') + ';background:' + (e ? 'rgba(148,163,184,.14)' : '#f8fafc') +
            ';color:' + (e ? '#e2e8f0' : '#334155') + ';font:600 13px/20px system-ui,sans-serif;border-radius:999px;padding:1px 12px;cursor:pointer;white-space:nowrap;width:auto;margin:0';
    }
    function iniciar() {
        if (!link && !temaProprio) return; // páginas sem tema escuro: nada a alternar
        var c = acoes();
        if (!c || botao) return;
        botao = document.createElement('button');
        botao.type = 'button'; botao.id = 'tema-botao';
        botao.addEventListener('click', alternar);
        c.insertBefore(botao, c.firstChild);
        atualizarBotao();
    }

    aplicar(); // antes da primeira pintura
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

    window.MagoTema = { escuro: escuro, acoes: acoes, alternar: alternar };
})();
