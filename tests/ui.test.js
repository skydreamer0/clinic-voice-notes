import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const modulePath=process.env.JSDOM_MODULE || 'jsdom';
// Pinned development-only DOM tool, never an app runtime dependency.
test('DOM integration: input, review, edit invalidation, persistence, new-case isolation', {},async()=>{
 const {JSDOM}=require(modulePath);const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test/clinic-voice-notes/'});
 for(const key of ['window','document','localStorage'])globalThis[key]=dom.window[key];
 window.confirm=()=>true;await import('../app.js');const $=id=>document.getElementById(id);const input=(node,value)=>{node.value=value;node.dispatchEvent(new window.Event('input',{bubbles:true}));};
 assert.equal(localStorage.length,0);input($('source'),'<img src=x onerror=alert(1)>');$('field').value='S';$('add').click();assert.equal(document.querySelectorAll('.segment').length,1);assert.equal(document.querySelectorAll('img').length,0);assert.equal($('export').disabled,true);
 $('reviewed').checked=true;$('confirm').click();assert.equal($('export').disabled,false);
 input($('segment-text-0'),'人工修正');assert.equal($('export').disabled,true);assert.equal($('reviewed').checked,false);assert.match(document.querySelector('pre').textContent,/<img src=x/);
 $('persist').checked=true;$('persist').dispatchEvent(new window.Event('change'));assert.equal(localStorage.length,1);input($('source'),'尚未加入');assert.match(localStorage.getItem('clinic-mobile-draft-v1'),/尚未加入/);
 $('reviewed').checked=true;$('confirm').click();assert.equal($('export').disabled,true);assert.match($('status').textContent,/未加入/);
 $('new').click();assert.equal(localStorage.length,0);assert.equal($('source').value,'');assert.equal(document.querySelectorAll('.segment').length,0);assert.equal($('persist').checked,false);assert.equal($('export').disabled,true);dom.window.close();
});
test('edit limit failure restores displayed state and invalidates confirmation', {},async()=>{
 const {JSDOM}=require(modulePath);const dom=new JSDOM(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://example.test/clinic-voice-notes/'});
 for(const key of ['window','document','localStorage'])globalThis[key]=dom.window[key];
 const s={version:1,session:'limit',revision:5000,nextId:2,segments:[{id:'limit:1',source:'start',draft:'4999',field:'S'}],history:[{type:'add',id:'limit:1',field:'S',revision:1}],confirmed:null};
 for(let i=1;i<5000;i++)s.history.push({type:'edit',id:'limit:1',before:i===1?'start':String(i-1),after:String(i),from:'S',to:'S',revision:i+1});
 localStorage.setItem('clinic-mobile-draft-v1',JSON.stringify({state:s,pending:{text:'',field:''}}));window.confirm=()=>true;
 await import('../app.js?limit-regression');const $=id=>document.getElementById(id);$('reviewed').checked=true;$('confirm').click();assert.equal($('export').disabled,false);
 $('segment-text-0').value='must not silently export old';$('segment-text-0').dispatchEvent(new window.Event('input'));assert.equal($('segment-text-0').value,'4999');assert.equal($('export').disabled,true);assert.equal($('reviewed').checked,false);assert.match($('status').textContent,/未套用/);dom.window.close();
});
