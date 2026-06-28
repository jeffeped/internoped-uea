// InternoPed UEA — Service Worker
// Versão do cache: atualize este número ao fazer deploy de nova versão
const CACHE_NAME = 'internoped-uea-v1';
const CACHE_URLS = [
  './APP_Interno_Pediatria.html',
  './interno_manifest.json'
];

// Instalação: pré-cacheia os arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para arquivos locais, network-first para API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requisições ao Google Apps Script vão direto para a rede
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para tudo mais: cache first, fallback para rede
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cacheia respostas válidas
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback: devolve o HTML principal
      if (event.request.mode === 'navigate') {
        return caches.match('./APP_Interno_Pediatria.html');
      }
    })
  );
});

// Mensagem para forçar atualização (chamada pelo app)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
