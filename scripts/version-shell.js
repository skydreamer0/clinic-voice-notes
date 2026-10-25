// Run for every static shell change. The test gate rejects stale worker versions.
import fs from 'node:fs';import crypto from 'node:crypto';
const assets=['index.html','styles.css','app.js','state.js','manifest.webmanifest','icons/app.svg'];
export const digest=crypto.createHash('sha256').update(assets.map(name=>`${name}\0${fs.readFileSync(new URL('../'+name,import.meta.url),'utf8')}`).join('\0')).digest('hex').slice(0,20);
const path=new URL('../sw.js',import.meta.url);const code=fs.readFileSync(path,'utf8');
if (process.argv.includes('--write'))fs.writeFileSync(path,code.replace(/const CACHE = `\$\{CACHE_PREFIX\}[^`]+`;/,`const CACHE = \`\${CACHE_PREFIX}${digest}\`;`));
