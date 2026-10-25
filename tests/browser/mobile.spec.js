import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const synthetic='虛構測試資料：紅色方塊 123。';
async function add(page,text=synthetic,field='S'){await page.locator('#source').fill(text);await page.locator('#field').selectOption(field);await page.locator('#add').click();}
async function confirm(page){await page.locator('#reviewed').check();await page.locator('#confirm').click();}
test.beforeEach(async({page})=>{page.on('dialog',dialog=>dialog.accept());await page.goto('./');});
test('guided/manual freeform, immutable source, correction invalidates review, real text download',async({page})=>{
 await add(page);await confirm(page);await expect(page.locator('#export')).toBeEnabled();
 await page.locator('#segment-text-0').fill('虛構測試：藍色方塊 124。');await expect(page.locator('#export')).toBeDisabled();await expect(page.locator('#reviewed')).not.toBeChecked();
 await page.locator('summary').first().click();await expect(page.locator('pre').first()).toContainText(synthetic);
 await add(page,'虛構測試：另一個方塊。','');await confirm(page);await expect(page.locator('#export')).toBeDisabled();
 await page.locator('#segment-field-1').selectOption('O');await confirm(page);await expect(page.locator('#export')).toBeEnabled();
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;const path=await download.path();const content=await fs.readFile(path,'utf8');expect(content).toContain('非正式病歷');expect(content).toContain('A\n（未填寫）');expect(content).toContain(synthetic);expect(content).toContain('藍色方塊 124');
 await expect(page.locator('body')).toHaveJSProperty('scrollWidth',await page.locator('body').evaluate(el=>el.clientWidth));
});
test('memory default; opt-in persists pending input; restore clears confirmation; new case isolated',async({page})=>{
 await add(page);expect(await page.evaluate(()=>localStorage.length)).toBe(0);await confirm(page);await page.locator('#persist').check();await page.locator('#source').fill('虛構尚未加入');await page.reload();
 await expect(page.locator('#source')).toHaveValue('虛構尚未加入');await expect(page.locator('#segment-text-0')).toHaveValue(synthetic);await expect(page.locator('#export')).toBeDisabled();
 await page.locator('#new').click();await expect(page.locator('#source')).toHaveValue('');await expect(page.locator('.segment')).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('clinic-mobile-draft-v1'))).toBeNull();await expect(page.locator('#persist')).not.toBeChecked();
});
test('project subpath SW controls shell; offline reload works; cache contains only static assets',async({page,context})=>{
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await add(page);await page.locator('#persist').check();
 const requests=[];page.on('request',request=>requests.push(request.url()));await context.setOffline(true);await page.reload();await expect(page.locator('h1')).toContainText('口述');await expect(page.locator('#segment-text-0')).toHaveValue(synthetic);
 const urls=await page.evaluate(async()=>{const keys=await caches.keys();const out=[];for(const key of keys){const cache=await caches.open(key);out.push(...(await cache.keys()).map(r=>r.url));}return out;});
 expect(urls).toHaveLength(7);for(const url of urls){expect(url).toMatch(/^http:\/\/127\.0\.0\.1:8766\/clinic-voice-notes\/(?:index\.html|styles\.css|app\.js|state\.js|manifest\.webmanifest|icons\/app\.svg)?$/);expect(url).not.toContain('?');}
 expect(requests.every(url=>url.startsWith('http://127.0.0.1:8766/clinic-voice-notes/'))).toBe(true);await context.setOffline(false);
});
test('test server never exposes source internals, receipts, git, query or POST routes',async({request})=>{
 for(const path of ['.git/config','HANDOFF.md','SOURCE-MANIFEST.json','tests/state.test.js','../package.json','?note=synthetic'])expect((await request.get('http://127.0.0.1:8766/clinic-voice-notes/'+path)).status()).toBe(404);
 expect((await request.post('http://127.0.0.1:8766/clinic-voice-notes/')).status()).toBe(404);
});
