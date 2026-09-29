// Aviso padrão de apoio à decisão clínica: faixa fixa no rodapé, fora do fluxo da página,
// para não interferir no layout das ferramentas (várias usam body em flex).
(function () {
  if (document.getElementById('aviso-clinico')) return;
  try { if (sessionStorage.getItem('aviso-clinico-oculto') === '1') return; } catch (e) {}

  var barra = document.createElement('aside');
  barra.id = 'aviso-clinico';
  barra.setAttribute('role', 'note');
  barra.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;align-items:center;' +
    'justify-content:center;gap:12px;padding:6px 12px;background:#fffbeb;color:#78350f;' +
    'border-top:1px solid #fcd34d;font:12px/1.4 system-ui,sans-serif;text-align:center';
  barra.innerHTML = '<span><strong>Aviso:</strong> apoio à decisão clínica; não substitui o julgamento do ' +
    'profissional nem protocolos locais. Confira os dados e não insira dados que identifiquem o paciente. ' +
    '<a href="index.html" style="color:#92400e;text-decoration:underline">Início</a></span>';

  var fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Ocultar aviso nesta sessão');
  fechar.textContent = '×';
  fechar.style.cssText = 'flex:none;border:0;background:transparent;color:#78350f;font-size:18px;' +
    'line-height:1;cursor:pointer;padding:0 4px';
  barra.appendChild(fechar);

  var baseline = null;
  function reservarEspaco(altura) {
    if (baseline === null) baseline = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    document.body.style.paddingBottom = (baseline + altura) + 'px';
  }
  fechar.addEventListener('click', function () {
    barra.remove();
    reservarEspaco(0);
    try { sessionStorage.setItem('aviso-clinico-oculto', '1'); } catch (e) {}
  });

  document.body.appendChild(barra);
  reservarEspaco(barra.offsetHeight);
  window.addEventListener('resize', function () { if (barra.isConnected) reservarEspaco(barra.offsetHeight); });
})();
