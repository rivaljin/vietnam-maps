// Run with the repository served at http://127.0.0.1:8765/.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
 const context = await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Seoul'});
 const page = await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',dialog=>dialog.accept());
 const base=process.env.TRIP_TEST_URL||'http://127.0.0.1:8765/';
 await page.goto(base+'trip-expenses.html');
 await page.getByRole('status').filter({hasText:'오프라인 준비 완료'}).waitFor();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 assert.equal(await page.evaluate(()=>vietnamDate(new Date('2026-10-22T17:30:00Z'))),'2026-10-23');
 await context.setOffline(true);
 await page.reload();
 await page.locator('#item').fill('오프라인 테스트');await page.locator('#amt').fill('25000');await page.getByRole('button',{name:'＋ 추가하기'}).click();
 await page.reload();assert.match(await page.locator('#list').innerText(),/오프라인 테스트/);
 const count=await page.evaluate(()=>load().length);
 const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'경비 백업'}).click();
 const download=await downloadEvent;const stream=await download.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk;
 const backup=JSON.parse(raw);assert.equal(backup.entries.length,count);
 await page.evaluate(()=>{save([]);render();});
 await page.locator('#restore-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(raw)});
 await page.waitForFunction(n=>load().length===n,count);
 await page.locator('#restore-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"entries":[{"amt":-1}]}')});
 await page.waitForFunction(()=>document.getElementById('restore-file').value==='');
 assert.equal(await page.evaluate(()=>load().length),count);
 await page.evaluate(()=>{const entries=load();entries[0].cat='<img src=x onerror=alert(1)>';save(entries);render();});
 assert.equal(await page.locator('#totals img, #list img').count(),0);
 assert.equal(await page.evaluate(()=>{const old=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('quota')};try{return save([])}finally{Storage.prototype.setItem=old}}),false);
 for(const path of ['','index.html','vietnam-map.html','hanoi-food.html','trip-itinerary.html']){
  await page.goto(base+path,{waitUntil:'domcontentloaded'});
  await page.getByRole('status').filter({hasText:'오프라인 모드'}).waitFor();
  assert.ok((await page.locator('body').innerText()).length>200,path+' has content');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: offline routes, expense persistence, Vietnam date, backup/restore, invalid backup rejection, storage failure, mobile viewport; no JS errors');
 await context.close();
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
