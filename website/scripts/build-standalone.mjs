import { build } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.resolve(root,'../.scratch/consumer-standalone');
await build({root,base:'./',build:{outDir:out,emptyOutDir:true,copyPublicDir:false,cssCodeSplit:false,rollupOptions:{output:{inlineDynamicImports:true}}}});
let html=await readFile(path.join(out,'index.html'),'utf8');
for(const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
 const js=await readFile(path.resolve(out,match[1]),'utf8');
 html=html.replace(match[0],()=>`<script type="module">${js.replaceAll('</script','<\\/script')}</script>`);
}
for(const match of [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)]) {
 const css=await readFile(path.resolve(out,match[1]),'utf8');
 html=html.replace(match[0],()=>`<style>${css}</style>`);
}
const output=path.resolve(root,'../outputs/dashboard/2026-11-18-food-signal.html');
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,html);
console.log(`Standalone dashboard: ${output}`);
