// Sugestões, dúvidas e contato: janela com formulário enviado pelo Netlify Forms (o formulário "contato" está em index.html).
// As mensagens ficam no painel da Netlify (Forms) e podem gerar e-mail de aviso; nenhum endereço aparece no site.
(function () {
    var NOME_FORM = 'contato';
    var TIPOS = ['Sugestão', 'Dúvida', 'Erro em uma ferramenta', 'Contato / parceria'];
    var dlg = null;

    function escuro() {
        if (window.MagoTema) return window.MagoTema.escuro();
        return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    function cores() {
        return escuro()
            ? { fundo: '#1f2937', texto: '#f3f4f6', suave: '#9ca3af', borda: '#374151', campo: '#111827', btn: '#2563eb', btnTxt: '#fff', ok: '#6ee7b7', erro: '#fca5a5',
                pill: { fundo: 'rgba(96,165,250,.14)', borda: '#60a5fa', texto: '#bfdbfe' } }
            : { fundo: '#ffffff', texto: '#111827', suave: '#6b7280', borda: '#d1d5db', campo: '#f9fafb', btn: '#1d4ed8', btnTxt: '#fff', ok: '#047857', erro: '#b91c1c',
                pill: { fundo: '#eff6ff', borda: '#60a5fa', texto: '#1d4ed8' } };
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    function montar() {
        var C = cores();
        dlg = document.createElement('dialog');
        dlg.id = 'contato-dialogo';
        dlg.setAttribute('aria-labelledby', 'contato-titulo');
        dlg.style.cssText = 'border:1px solid ' + C.borda + ';border-radius:16px;padding:20px;max-width:420px;width:calc(100% - 32px);background:' + C.fundo +
            ';color:' + C.texto + ';font:14px/1.5 system-ui,sans-serif';
        var campo = 'width:100%;box-sizing:border-box;margin:4px 0 12px;padding:8px;border:1px solid ' + C.borda + ';border-radius:8px;background:' + C.campo + ';color:' + C.texto + ';font:inherit';
        dlg.innerHTML =
            '<h2 id="contato-titulo" style="margin:0 0 4px;font-size:18px">Fale com o Mago</h2>' +
            '<p style="margin:0 0 12px;color:' + C.suave + '">Sugestões, dúvidas, erros nas ferramentas ou contato. <strong>Não envie dados que identifiquem pacientes.</strong></p>' +
            '<form data-form>' +
            '<p style="display:none"><label>Não preencha: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
            '<label style="font-weight:600">Assunto<select name="tipo" style="' + campo + '">' + TIPOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
            '<label style="font-weight:600">Mensagem<textarea name="mensagem" required minlength="5" maxlength="2000" rows="5" style="' + campo + ';resize:vertical"></textarea></label>' +
            '<label style="font-weight:600">E-mail ou WhatsApp para resposta <span style="font-weight:400;color:' + C.suave + '">(opcional)</span>' +
            '<input name="contato" maxlength="120" autocomplete="off" style="' + campo + '"></label>' +
            '<p data-status role="status" style="margin:0 0 8px;min-height:1.2em"></p>' +
            '<div style="display:flex;gap:8px"><button type="submit" data-enviar style="flex:1;border:0;border-radius:8px;padding:9px;background:' + C.btn + ';color:' + C.btnTxt + ';font-weight:700;cursor:pointer;width:auto;margin:0">Enviar</button>' +
            '<button type="button" data-fechar style="border:1px solid ' + C.borda + ';border-radius:8px;padding:9px 14px;background:transparent;color:inherit;cursor:pointer;width:auto;margin:0">Fechar</button></div>' +
            '</form>';
        dlg.querySelector('[data-fechar]').addEventListener('click', function () { dlg.close(); });
        dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
        dlg.querySelector('form').addEventListener('submit', enviar);
        document.body.appendChild(dlg);
    }

    function enviar(e) {
        e.preventDefault();
        var f = e.target, C = cores(), st = dlg.querySelector('[data-status]'), btn = dlg.querySelector('[data-enviar]');
        if (f.elements['bot-field'].value) return; // robô
        var dados = new URLSearchParams();
        dados.append('form-name', NOME_FORM);
        dados.append('tipo', f.elements.tipo.value);
        dados.append('mensagem', f.elements.mensagem.value.trim());
        dados.append('contato', f.elements.contato.value.trim());
        dados.append('pagina', location.pathname + ' | ' + document.title);
        dados.append('bot-field', '');
        btn.disabled = true; btn.textContent = 'Enviando…'; st.style.color = C.suave; st.textContent = '';
        fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: dados.toString() })
            .then(function (r) {
                if (!r.ok) throw new Error('http ' + r.status);
                st.style.color = C.ok; st.textContent = 'Mensagem enviada. Obrigado!';
                f.reset(); btn.textContent = 'Enviar';
                setTimeout(function () { btn.disabled = false; }, 4000); // evita envios repetidos em sequência
            })
            .catch(function () {
                st.style.color = C.erro; st.textContent = 'Não foi possível enviar agora. Tente novamente mais tarde.';
                btn.disabled = false; btn.textContent = 'Enviar';
            });
    }

    function abrir() {
        if (!dlg) montar();
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
        var m = dlg.querySelector('[name=mensagem]'); if (m) m.focus();
    }

    // o tema mudou: a janela é refeita na próxima abertura
    window.addEventListener('mago-tema', function () { if (dlg) { if (dlg.open) dlg.close(); dlg.remove(); dlg = null; } });

    var print = document.createElement('style');
    print.textContent = '@media print{[data-contato],#contato-dialogo{display:none !important}}';
    document.head.appendChild(print);

    function botaoTopo() {
        var b = document.createElement('button');
        b.type = 'button'; b.id = 'contato-topo'; b.setAttribute('data-contato', ''); b.innerHTML = '💬<span class="mago-rot"> Contato</span>';
        b.setAttribute('aria-label', 'Sugestões, dúvidas e contato com o Mago');
        function pintar() {
            var p = cores().pill;
            b.style.cssText = 'border:1px solid ' + p.borda + ';background:' + p.fundo + ';color:' + p.texto +
                ';font:600 13px/20px system-ui,sans-serif;border-radius:999px;padding:1px 12px;cursor:pointer;white-space:nowrap;width:auto;margin:0';
        }
        pintar(); window.addEventListener('mago-tema', pintar);
        b.addEventListener('click', abrir);
        var caixa = window.MagoTema && window.MagoTema.acoes();
        if (caixa) { var apoio = caixa.querySelector('#apoio-topo'); caixa.insertBefore(b, apoio); }
        else { b.style.cssText += ';position:absolute;top:4px;left:12px;z-index:40'; document.body.appendChild(b); }
    }
    function iniciar() {
        botaoTopo();
        var mount = document.getElementById('contato-mount'); // página inicial: link no rodapé
        if (mount) {
            var a = document.createElement('button');
            a.type = 'button'; a.setAttribute('data-contato', ''); a.textContent = '💬 Sugestões, dúvidas e contato';
            a.style.cssText = 'border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;width:auto;margin:0';
            a.addEventListener('click', abrir); mount.appendChild(a);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
