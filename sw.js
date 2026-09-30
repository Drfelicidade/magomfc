// Service worker do site: permite consultar as Manobras do Exame Físico sem internet.
// Só trata as páginas/arquivos listados; as demais páginas (login, IA, funções Netlify) nunca passam pelo cache.
const VERSAO = 'manobras-v1';
const ARQUIVOS = ['manobras-exame-fisico.html', 'data/manobras.json', 'assets/tema-escuro.css', 'assets/aviso.js', 'assets/favicon.svg', 'assets/favicon-32.png', 'assets/apple-touch-icon.png', 'regras-ottawa-tornozelo.html', 'calculadora-nihss.html', 'index.html'];
const CDN = 'https://cdn.tailwindcss.com/';

self.addEventListener('install', e => {
    e.waitUntil(caches.open(VERSAO).then(c => Promise.all(ARQUIVOS.map(a => c.add(a).catch(() => null)).concat(fetch(CDN, { mode: 'no-cors' }).then(r => c.put(CDN, r)).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function tratar(url) {
    if (url.href.indexOf(CDN) === 0) return true;
    if (url.origin !== self.location.origin) return false;
    const p = url.pathname.replace(/^\//, '');
    return ARQUIVOS.some(a => a === p || a === p + '.html') || p === '' || p.indexOf('assets/manobras/') === 0;
}
// Rede primeiro (conteúdo sempre atualizado quando há internet); cache como reserva
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (!tratar(url)) return;
    e.respondWith(fetch(e.request).then(r => {
        if (r && (r.ok || r.type === 'opaque')) { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(e.request, copia)); }
        return r;
    }).catch(() => caches.match(e.request).then(r => {
        if (r) return r;
        if (url.origin !== self.location.origin) return Response.error(); // CDN fora do cache: falha normal, nunca devolve HTML no lugar de um script
        const p = url.pathname.replace(/^\//, '');
        return caches.match((p === '' ? 'index.html' : (/\.\w+$/.test(p) ? p : p + '.html'))).then(x => x || Response.error());
    })));
});
