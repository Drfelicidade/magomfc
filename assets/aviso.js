// Aviso padrão de apoio à decisão clínica, injetado no final de cada ferramenta.
(function () {
  if (document.getElementById('aviso-clinico')) return;
  var aviso = document.createElement('aside');
  aviso.id = 'aviso-clinico';
  aviso.setAttribute('role', 'note');
  aviso.style.cssText = 'max-width:900px;margin:24px auto;padding:12px 16px;border:1px solid #fcd34d;' +
    'background:#fffbeb;color:#78350f;border-radius:12px;font:14px/1.5 system-ui,sans-serif';
  aviso.innerHTML = '<strong>Aviso:</strong> ferramenta de apoio à decisão clínica. ' +
    'Não substitui o julgamento do profissional de saúde nem protocolos locais. ' +
    'Confira sempre os dados inseridos e as referências atualizadas antes de conduzir o caso. ' +
    'Não insira dados que identifiquem o paciente. ' +
    '<a href="index.html" style="color:#92400e;text-decoration:underline">Voltar ao início</a>.';
  document.body.appendChild(aviso);
})();
