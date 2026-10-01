// Apoio voluntário (Pix) e medição de uso, de forma discreta.
// Enquanto CONFIG.chavePix estiver vazia, nada aparece. Preencha o bloco abaixo para ativar.
(function () {
    var CONFIG = {
        // Chave Pix própria: CPF/CNPJ (só números), e-mail, celular (+5511999999999) ou chave aleatória.
        chavePix: 'tdandre@gmail.com',
        // Nome do recebedor (até 25 caracteres) e cidade (até 15), como no cadastro do banco.
        nomeRecebedor: 'André L Felicidade Silva', // o limite do Pix é 25 caracteres: nome completo não cabe
        cidade: 'Blumenau',
        // Valores sugeridos em reais (além de "qualquer valor").
        valores: [10, 25, 50],
        // Medição de uso sem cookies. Deixe em branco para não medir. Exemplo (Plausible):
        // analytics: { src: 'https://plausible.io/js/script.js', atributos: { 'data-domain': 'seu-dominio.com.br' } }
        analytics: { src: '', atributos: {} }
    };

    // ---------- Medição de uso (respeita "Não rastrear") ----------
    try {
        var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
        if (CONFIG.analytics.src && !dnt) {
            var a = document.createElement('script');
            a.defer = true; a.src = CONFIG.analytics.src;
            Object.keys(CONFIG.analytics.atributos || {}).forEach(function (k) { a.setAttribute(k, CONFIG.analytics.atributos[k]); });
            document.head.appendChild(a);
        }
    } catch (e) { /* medição é opcional */ }

    if (!CONFIG.chavePix || !CONFIG.nomeRecebedor || !CONFIG.cidade) return;

    // ---------- Pix copia e cola (BR Code estático do Banco Central) ----------
    function semAcento(t, max) {
        return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, max);
    }
    function campo(id, valor) { var n = String(valor.length); return id + (n.length < 2 ? '0' + n : n) + valor; }
    function crc16(texto) { // CRC16/CCITT-FALSE
        var crc = 0xFFFF;
        for (var i = 0; i < texto.length; i++) {
            crc ^= texto.charCodeAt(i) << 8;
            for (var b = 0; b < 8; b++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
        }
        var h = crc.toString(16).toUpperCase();
        return '0000'.slice(h.length) + h;
    }
    function brCode(valor) {
        var conta = campo('00', 'br.gov.bcb.pix') + campo('01', CONFIG.chavePix.trim());
        var p = campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986') +
            (valor ? campo('54', valor.toFixed(2)) : '') + campo('58', 'BR') +
            campo('59', semAcento(CONFIG.nomeRecebedor, 25)) + campo('60', semAcento(CONFIG.cidade, 15)) +
            campo('62', campo('05', '***')) + '6304';
        return p + crc16(p);
    }
    window.MagoApoio = { brCode: brCode, crc16: crc16 };

    // ---------- Janela de apoio ----------
    var dlg = null, valorAtual = 0;
    var escuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var C = escuro ? { fundo: '#1f2937', texto: '#f3f4f6', suave: '#9ca3af', borda: '#374151', destaque: '#34d399', btn: '#059669', btnTxt: '#fff' }
                   : { fundo: '#ffffff', texto: '#111827', suave: '#6b7280', borda: '#d1d5db', destaque: '#047857', btn: '#047857', btnTxt: '#fff' };

    function carregarQr(cb) {
        if (window.qrcode) return cb();
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
        s.integrity = 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1';
        s.crossOrigin = 'anonymous';
        s.onload = cb; s.onerror = function () { cb(); };
        document.head.appendChild(s);
    }
    function desenhar() {
        var codigo = brCode(valorAtual);
        dlg.querySelector('[data-codigo]').value = codigo;
        var alvo = dlg.querySelector('[data-qr]');
        if (window.qrcode) {
            var qr = window.qrcode(0, 'M'); qr.addData(codigo); qr.make();
            alvo.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
            var svg = alvo.querySelector('svg');
            if (svg) { svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.background = '#fff'; svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'QR Code Pix'); }
        } else alvo.textContent = 'Não foi possível gerar o QR Code. Use o código «copia e cola» abaixo.';
        dlg.querySelectorAll('[data-valor]').forEach(function (b) {
            var ativo = +b.dataset.valor === valorAtual;
            b.setAttribute('aria-pressed', ativo ? 'true' : 'false');
            b.style.background = ativo ? C.btn : 'transparent'; b.style.color = ativo ? C.btnTxt : C.texto;
        });
    }
    function montar() {
        dlg = document.createElement('dialog');
        dlg.id = 'apoio-dialogo';
        dlg.setAttribute('aria-labelledby', 'apoio-titulo');
        dlg.style.cssText = 'border:1px solid ' + C.borda + ';border-radius:16px;padding:20px;max-width:360px;width:calc(100% - 32px);background:' + C.fundo + ';color:' + C.texto + ';font:14px/1.5 system-ui,sans-serif';
        var botoes = [0].concat(CONFIG.valores).map(function (v) {
            return '<button type="button" data-valor="' + v + '" style="border:1px solid ' + C.borda + ';border-radius:999px;padding:4px 12px;cursor:pointer;font:inherit;background:transparent;color:inherit">' + (v ? 'R$ ' + v : 'Qualquer valor') + '</button>';
        }).join(' ');
        dlg.innerHTML = '<h2 id="apoio-titulo" style="margin:0 0 6px;font-size:18px">Apoie o Mago MFC</h2>' +
            '<p style="margin:0 0 12px;color:' + C.suave + '">As ferramentas são gratuitas. Sua contribuição voluntária ajuda a manter o site, a leitura de exames por IA e as próximas ferramentas.</p>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">' + botoes + '</div>' +
            '<div data-qr style="width:200px;margin:0 auto 10px"></div>' +
            '<label style="display:block;font-size:12px;color:' + C.suave + ';margin-bottom:4px" for="apoio-codigo">Pix copia e cola</label>' +
            '<input id="apoio-codigo" data-codigo readonly style="width:100%;box-sizing:border-box;padding:8px;border:1px solid ' + C.borda + ';border-radius:8px;background:transparent;color:inherit;font:12px monospace">' +
            '<div style="display:flex;gap:8px;margin-top:10px"><button type="button" data-copiar style="flex:1;border:0;border-radius:8px;padding:8px;background:' + C.btn + ';color:' + C.btnTxt + ';font-weight:700;cursor:pointer">Copiar código</button>' +
            '<button type="button" data-fechar style="border:1px solid ' + C.borda + ';border-radius:8px;padding:8px 12px;background:transparent;color:inherit;cursor:pointer">Fechar</button></div>' +
            '<p style="margin:10px 0 0;font-size:11px;color:' + C.suave + '">Recebedor: ' + semAcento(CONFIG.nomeRecebedor, 25) + '. Contribuição voluntária: não dá acesso a conteúdo exclusivo.</p>';
        dlg.querySelectorAll('[data-valor]').forEach(function (b) { b.addEventListener('click', function () { valorAtual = +b.dataset.valor; desenhar(); }); });
        dlg.querySelector('[data-fechar]').addEventListener('click', function () { dlg.close(); });
        dlg.querySelector('[data-copiar]').addEventListener('click', function () {
            var campoCodigo = dlg.querySelector('[data-codigo]'), btn = dlg.querySelector('[data-copiar]');
            var ok = function () { btn.textContent = 'Copiado!'; setTimeout(function () { btn.textContent = 'Copiar código'; }, 1800); };
            if (navigator.clipboard) navigator.clipboard.writeText(campoCodigo.value).then(ok, function () { campoCodigo.select(); document.execCommand('copy'); ok(); });
            else { campoCodigo.select(); document.execCommand('copy'); ok(); }
        });
        dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
        document.body.appendChild(dlg);
    }
    function abrir() {
        if (!dlg) montar();
        valorAtual = 0;
        carregarQr(function () { desenhar(); });
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }

    // ---------- Ponto de entrada discreto ----------
    function criarLink(estilo) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('data-apoio', ''); b.textContent = '☕ Apoie o Mago MFC';
        b.style.cssText = estilo; b.addEventListener('click', abrir);
        return b;
    }
    var print = document.createElement('style');
    print.textContent = '@media print{[data-apoio],#apoio-dialogo{display:none !important}}';
    document.head.appendChild(print);

    // Link pequeno no alto da página (rola junto com o conteúdo, não fica fixo na tela)
    function linkCabecalho() {
        var cor = escuro ? '#9ca3af' : '#6b7280';
        var b = criarLink('position:absolute;top:1px;right:10px;z-index:40;border:0;background:transparent;color:' + cor +
            ';font:11px/14px system-ui,sans-serif;text-decoration:underline;cursor:pointer;padding:0;opacity:.85');
        b.id = 'apoio-topo'; b.textContent = '☕ Apoie';
        b.setAttribute('aria-label', 'Apoie o Mago MFC');
        document.body.appendChild(b);
    }

    function iniciar() {
        linkCabecalho();
        var mount = document.getElementById('apoio-mount'); // página inicial: linha própria no rodapé
        if (mount) { mount.appendChild(criarLink('border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit')); return; }
        var barra = document.getElementById('aviso-clinico'); // demais páginas: dentro da faixa do aviso, sem ocupar espaço extra
        if (barra) {
            var fechar = barra.querySelector('button');
            barra.insertBefore(criarLink('flex:none;border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;font-size:12px;white-space:nowrap'), fechar);
            window.dispatchEvent(new Event('resize')); // a faixa pode ter ficado mais alta: reajusta o espaço reservado
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
