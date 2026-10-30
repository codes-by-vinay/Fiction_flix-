const CACHE='fictionflix-shell-v8';
const APP_SHELL=['/','/index.html','/manifest.webmanifest','/assets/story-veergatha.png','/assets/hero-naglok.png','/assets/story-rahasyamayi-haveli.png','/assets/hero-adhuri-mohabbat.png','/assets/story-wapasi.png','/assets/story-gumnaam.png','/assets/detail-kala-sach.png','/assets/experience-vertical.png','/assets/story-naglok.png','/assets/hero-khoya-khazana.png','/assets/hero-kala-sach.png','/assets/detail-khoya-khazana.png','/assets/story-sandhya-rahasya.png','/assets/experience-audio.png','/assets/hero-rahasyamayi-haveli.png','/assets/story-kala-sach.png','/assets/fictionflix-logo.png','/assets/experience-book.png','/assets/story-anant.png','/assets/story-adhuri-mohabbat.png','/assets/story-khoya-khazana.png','/assets/detail-naglok.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/uploads/')||/^\/(?:login|profile|User\.html|admin|reset-password)(?:\/|$)/.test(url.pathname))return;
 if(url.pathname!=='/'&&url.pathname!=='/index.html'&&!url.pathname.startsWith('/assets/')&&url.pathname!=='/manifest.webmanifest')return;
 const cacheResponse=response=>{
  if(response.ok&&response.type==='basic'){
   const copy=response.clone();
   caches.open(CACHE).then(cache=>cache.put(request,copy));
  }
  return response;
 };
 if(request.mode==='navigate'||url.pathname==='/'||url.pathname==='/index.html'){
  event.respondWith(fetch(request).then(cacheResponse).catch(()=>caches.match('/index.html')));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(cacheResponse).catch(()=>Response.error())));
});
