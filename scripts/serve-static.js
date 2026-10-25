import http from 'node:http';import fs from 'node:fs';
export const PREFIX='/clinic-voice-notes/';
const types={'index.html':'text/html; charset=utf-8','styles.css':'text/css','app.js':'text/javascript','state.js':'text/javascript','sw.js':'text/javascript','manifest.webmanifest':'application/manifest+json','icons/app.svg':'image/svg+xml'};
export function handler(request,response){
  const url=new URL(request.url,'http://localhost');const name=url.pathname===PREFIX?'index.html':url.pathname.startsWith(PREFIX)?url.pathname.slice(PREFIX.length):'';
  if(!['GET','HEAD'].includes(request.method)||url.search||!Object.hasOwn(types,name)){response.writeHead(404);response.end('Not found');return;}
  const body=fs.readFileSync(new URL('../'+name,import.meta.url));response.writeHead(200,{'Content-Type':types[name],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(request.method==='HEAD'?undefined:body);
}
if(process.argv.includes('--serve'))http.createServer(handler).listen(8766,'127.0.0.1',()=>console.log('Static test server ready on loopback project subpath'));
