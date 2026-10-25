import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,addSegment,editSegment,confirmReview,isConfirmed,exportDraft,serialize,restore} from '../state.js';
const source = '虛構測試：數字 123，沒有其他內容。';
test('source stays immutable, edits logged and revision invalidates confirmation',()=>{
 let s=addSegment(createSession('test-one'),source,'S');s=confirmReview(s,true);assert.ok(isConfirmed(s));
 const id=s.segments[0].id;s=editSegment(s,id,'人工修正 124','O');assert.equal(s.segments[0].source,source);assert.equal(s.revision,2);assert.equal(s.history[1].before,source);assert.equal(s.history[1].after,'人工修正 124');assert.ok(!isConfirmed(s));assert.throws(()=>exportDraft(s));
});
test('manual assignment and affirmative human review required; A/P can remain blank',()=>{
 let s=addSegment(createSession('two'),source);assert.throws(()=>confirmReview(s,true));s=editSegment(s,s.segments[0].id,source,'S');assert.throws(()=>confirmReview(s,false));s=confirmReview(s,true);assert.match(exportDraft(s),/A\n（未填寫）/);assert.match(exportDraft(s),/非正式病歷/);
});
test('blank drafts and invalid IDs cannot bypass gate',()=>{
 let s=addSegment(createSession('three'),source,'S');assert.throws(()=>editSegment(s,'another:1','text','O'));s=editSegment(s,s.segments[0].id,' ','S');assert.throws(()=>confirmReview(s,true));assert.throws(()=>addSegment(s,'','S'));assert.throws(()=>addSegment(s,'x','X'));
});
test('new session has no state or confirmation from previous case',()=>{
 let a=confirmReview(addSegment(createSession('case-a'),source,'S'),true);const b=createSession('case-b');assert.equal(b.segments.length,0);assert.equal(b.history.length,0);assert.throws(()=>exportDraft({...a,session:b.session}));assert.throws(()=>exportDraft(b));
});
test('reload retains original/history/pending but always resets confirmation',()=>{
 let s=addSegment(createSession('reload'),source,'S');s=editSegment(s,s.segments[0].id,'修正後','O');s=confirmReview(s,true);const r=restore(serialize(s,{text:'尚未加入',field:'P'}));assert.deepEqual(r.state.segments,s.segments);assert.deepEqual(r.state.history,s.history);assert.equal(r.pending.text,'尚未加入');assert.equal(r.state.confirmed,null);
});
test('malformed, cross-case, duplicate and inconsistent storage rejected',()=>{
 const s=addSegment(createSession('valid'),source,'S');
 for(const alter of [v=>v.state.segments[0].id='other:1',v=>v.state.segments.push(v.state.segments[0]),v=>v.state.segments[0].draft='forged',v=>v.state.history[0].revision=2,v=>v.pending.field='X']){const v=JSON.parse(serialize(s));alter(v);assert.throws(()=>restore(JSON.stringify(v)));}
 assert.throws(()=>restore('null'));assert.throws(()=>restore('{bad'));
});
test('adding to confirmed case invalidates prior review, source text never interpreted as HTML',()=>{
 let s=confirmReview(addSegment(createSession('markup'),'<script>bad</script>','S'),true);s=addSegment(s,'second','O');assert.equal(s.confirmed,null);assert.equal(s.segments[0].source,'<script>bad</script>');
});
test('serialize refuses payloads that restore would reject for size',()=>{
 let s=addSegment(createSession('large'),'a'.repeat(50000),'S');for(let i=0;i<32;i++)s=editSegment(s,s.segments[0].id,(i%2?'a':'b').repeat(50000),'S');assert.throws(()=>serialize(s),/大小上限/);
});
